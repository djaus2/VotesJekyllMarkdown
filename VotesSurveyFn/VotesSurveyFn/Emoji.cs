using Azure;
using Azure.Data.Tables;
using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System;
using System.IO.Pipelines;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml.Linq;
public class EmojiEntity : ITableEntity
{
    public string PartitionKey { get; set; } = default!;
    public string RowKey { get; set; } = default!;
    public ETag ETag { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
    public int Value { get; set; }
}
public class VoteEntity : ITableEntity
{
    public string PartitionKey { get; set; } = default!;
    public string RowKey { get; set; } = default!;
    public ETag ETag { get; set; }
    public DateTimeOffset? Timestamp { get; set; }
}
public class ResetRequest
{
    public string? Action { get; set; }
    public string? Secret { get; set; }
    public string? Ns { get; set; }
    public string? Key { get; set; }
    public string? Extent { get; set; }
    public string? Client { get; set; }
}
public class EmojiFunction
{
    private readonly TableClient _counts;
    private readonly TableClient _votes;
    private const string CountsTable = "MySurveyTallies";
    private const string VotesTable = "MySurveyLogs";
    private static string SanitizeForKey(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return "home";
        // Disallow '/', '\', '#', '?', control chars; replace '/' with '_'
        s = s.Replace('/', '_').Replace('\\', '_').Replace('#', '_').Replace('?', '_');
        // Remove control chars
        s = new string(s.Where(ch => ch >= ' ' && ch != 127).ToArray());
        // Optional: further restrict to a-zA-Z0-9-_.
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[^a-zA-Z0-9\-_\.]", "_");
        if (string.IsNullOrWhiteSpace(s)) s = "home";
        return s;
    }
    private static string SanitizeId(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return "anon";
        // keep alnum, dash, underscore
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[^a-zA-Z0-9\-_]", "");
        return string.IsNullOrWhiteSpace(s) ? "anon" : s;
    }
    public EmojiFunction()
    {
        try
        {
            var conn = Environment.GetEnvironmentVariable("TABLES_CONNECTION")
                       ?? Environment.GetEnvironmentVariable("BLOB_STORAGE_CONNECTION_STRING");
            var svc = new TableServiceClient(conn);
            _counts = svc.GetTableClient(Environment.GetEnvironmentVariable("TABLE_NAME") ?? CountsTable);
            _votes = svc.GetTableClient(Environment.GetEnvironmentVariable("VOTES_TABLE") ?? VotesTable);
            _counts.CreateIfNotExists();
            _votes.CreateIfNotExists();
        } catch (Exception ex)
        {

        }
    }
    // inside your EmojiFunction class
    // Add "post" to the trigger
    [Function("emoji")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", "post", "options")] HttpRequestData req)
    {
        // Parse query as fallback
        if (string.Equals(req.Method, "OPTIONS", StringComparison.OrdinalIgnoreCase))         
        {             var pre = req.CreateResponse(HttpStatusCode.NoContent);             
            pre.Headers.Add("access-control-allow-origin", "*");             
            pre.Headers.Add("access-control-allow-methods", "GET,POST,OPTIONS");             
            pre.Headers.Add("access-control-allow-headers", "content-type");             
            pre.Headers.Add("access-control-max-age", "86400");             
            return pre;         
        }
        var q = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(req.Url.Query);
        // Attempt to read JSON body (for POST)
        ResetRequest? body = null;
        try
        {
            using var sr = new StreamReader(req.Body);
            var raw = await sr.ReadToEndAsync();
            if (!string.IsNullOrWhiteSpace(raw))
                body = JsonSerializer.Deserialize<ResetRequest>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch { /* ignore body parse errors */ }
        // Resolve inputs (body preferred, then query)
        var action = body?.Action ?? (q.TryGetValue("action", out var a) ? a.ToString() : "get");
        var nsRaw = body?.Ns ?? (q.TryGetValue("ns", out var n) ? n.ToString() : "djzblog");
        var keyRaw = body?.Key ?? (q.TryGetValue("key", out var k) ? k.ToString() : "home");
        var clientRaw = body?.Client ?? (q.TryGetValue("client", out var c) ? c.ToString() : "");
        var secret = body?.Secret ?? (q.TryGetValue("secret", out var s) ? s.ToString() : "");
        var clientId = SanitizeId(clientRaw);
        var extent = body?.Extent ?? (q.TryGetValue("extent", out var e) ? e.ToString() : "");
    
        var ns = SanitizeForKey(nsRaw);
        var key = SanitizeForKey(keyRaw);
        var countEntity = await GetOrCreateCount(ns, key);
        //reset:
        //=======
         //Add ADMIN_SECRET to environment variables
        // Pass that as secret
        // Option extent =all
        // key=all => wipe entire emoji tables; else just that ns/key
        /* Wipe all:
                GET.../ api / emoji ? action = reset & secret = YOUR_ADMIN & extent = all
                Response: { "ok":true,"wiped":"all"}
            Wipe specific:
                GET.../ api / emoji ? action = reset & secret = YOUR_ADMIN & ns = myblog & key = home
                Response: { "ok":true,"wiped":"myblog:home"}*/
        // Where ADMIN_SECRET = home
        if (action == "reset")
        {
            var token = secret;
            var admin = Environment.GetEnvironmentVariable("ADMIN_SECRET") ?? "";
            var rest = req.CreateResponse();
            rest.Headers.Add("content-type", "application/json");
            rest.Headers.Add("access-control-allow-origin", "*");
            rest.Headers.Add("access-control-allow-methods", "GET,POST,OPTIONS");
            rest.Headers.Add("access-control-allow-headers", "content-type");
            if (string.IsNullOrEmpty(admin) || token != admin)
            {
                rest.StatusCode = System.Net.HttpStatusCode.Unauthorized;
                await rest.WriteStringAsync("{\"ok\":false,\"error\":\"unauthorized\"}");
                return rest;
            }
            // key=all => wipe entire emoji tables; else just that ns/key
            if (extent=="all")
                await ResetEmojiAsync(ns, extent);
            else
                await ResetEmojiAsync(ns, key);
            rest.StatusCode = System.Net.HttpStatusCode.OK;
            var wiped = extent.Equals("all", StringComparison.OrdinalIgnoreCase) ? "all" : $"{ns}:{key}";
            await rest.WriteStringAsync("{\"ok\":true,\"wiped\":\"" + wiped + "\"}");
            return rest;
        }
        else if (action == "hit")
        {
            // Votes PK groups all votes for a page key
            var votesPk = $"{ns}:{key}";
            var votesRk = clientId;
            var exists = await VoteExists(votesPk, votesRk);
            if (!exists)
            {
                // record vote first (to avoid double-increment on retry)
                await _votes.AddEntityAsync(new VoteEntity { PartitionKey = votesPk, RowKey = votesRk });
                countEntity.Value += 1;
                await _counts.UpsertEntityAsync(countEntity, TableUpdateMode.Replace);
            }
        }
        var res = req.CreateResponse(HttpStatusCode.OK);
        res.Headers.Add("content-type", "application/json");
        res.Headers.Add("access-control-allow-origin", "*");
        res.Headers.Add("access-control-allow-methods", "GET,POST,OPTIONS");
        res.Headers.Add("access-control-allow-headers", "content-type");
        await res.WriteStringAsync($"{{\"value\":{countEntity.Value}}}");
        return res;
    }
    // helpers
    private async Task ResetEmojiAsync(string ns, string key)
    {
        // Wipe counts
        await DeleteNsKeyAsync(_counts, ns, key);
        // Wipe votes: PK is ns:key (your format), so handle both �all� and specific
        if (key.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            // delete all partitions in votes
            await DeleteEntitiesAsync(_votes, partitionFilter: null, rowFilter: null);
        }
        else
        {
            var votesPk = $"{ns}:{key}";
            await DeleteEntitiesAsync(_votes, partitionFilter: votesPk, rowFilter: null);
        }
    }
    private static string FilterEq(string prop, string value)
    {
        var safe = (value ?? string.Empty).Replace("'", "''");
        return prop + " eq '" + safe + "'";
    }
    // If key==all -> delete all; else delete PK/RK scoped rows
    private async Task DeleteNsKeyAsync(TableClient table, string ns, string key)
    {
        if (key.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            await DeleteEntitiesAsync(table, partitionFilter: null, rowFilter: null);
            return;
        }
        // Counts: PK = ns, RK = key
        string filter = $"{FilterEq("PartitionKey", ns)} and {FilterEq("RowKey", key)}";
        await DeleteByFilter(table, filter);
    }
    // Generic delete helpers
    private async Task DeleteEntitiesAsync(TableClient table, string? partitionFilter, string? rowFilter)
    {
        string? filter = null;
        if (!string.IsNullOrEmpty(partitionFilter))
            filter = FilterEq("PartitionKey", partitionFilter);
        if (!string.IsNullOrEmpty(rowFilter))
            filter = filter == null ? FilterEq("RowKey", rowFilter) : $"{filter} and {FilterEq("RowKey", rowFilter)}";
        await DeleteByFilter(table, filter);
    }
    
    private async Task DeleteByFilter(TableClient table, string? filter)
    {
        // Query and batch delete
        var pages = table.QueryAsync<TableEntity>(filter);
        await foreach (var entity in pages)
        {
            try { await table.DeleteEntityAsync(entity.PartitionKey, entity.RowKey); } catch { /* ignore */ }
        }
        
    }
    
    private async Task<EmojiEntity> GetOrCreateCount(string ns, string key)
    {
        try
        {
            var got = await _counts.GetEntityAsync<EmojiEntity>(ns, key);
            return got.Value;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 404)
        {
            var e = new EmojiEntity { PartitionKey = ns, RowKey = key, Value = 0 };
            await _counts.AddEntityAsync(e);
            return e;
        }
    }
    private async Task<bool> VoteExists(string pk, string rk)
    {
        try
        {
            await _votes.GetEntityAsync<VoteEntity>(pk, rk);
            return true;
        }
        catch (Azure.RequestFailedException ex) when (ex.Status == 404)
        {
            return false;
        }
    }
}

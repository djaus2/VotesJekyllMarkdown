# VotesJekyllMarkdown

Implementing voting on a Jekyll Blog Post page using an Azure Function and an Azure Blob Storage Table.

> Detailed discussion here: [Jekyll-Markdown-Add_voting_to_a_Blog_Post](https://davidjones.sportronics.com.au/web/Jekyll-Markdown-Add_voting_to_a_Blog_Post-web.html)
> And ... [Jekyll-Markdown-Add_voting_to_a_Blog_Post_-_How_to-web Part 1](https://davidjones.sportronics.com.au/web/Jekyll-Markdown-Add_voting_to_a_Blog_Post_-_How_to-web.htm)

Repository is in 3 parts:
- VotesSurveyFn
  - The Azure Function
- BlogFiles
  - Code files from an existing Blog site that implements the voting
    - Placed in the required folders.
- VotesBlogSite
  - A working Jekyll site In BloSite folder
    - Including Blog Site Files
    - Need
      - ```gem install bundler```
    - ```gem install jekyll```
    - To run ```bundle exec jekyll serve```
   
 ## Usage
Initially, only the Azure Blob Storage needs to be created. The Azure Function can run locally, and is initally configured to do so.
The Jekyll Site is run locally.

In an Azure Cli terminal, ... install form this if needed:
```bash
winget install Microsoft.AzureCLI
```
 
 1. Create an Azure Storage: 

 - Connect to your Azure subscription
```bash
az login
```
  - Will need to go to browser, choose account and login.

- Create a Resource Group
```bash
az group create --name myResourceGroup --location mylocation
```
  - ... where locations is from
```bash
az account list-locations --query "[].{Name:name, DisplayName:displayName}" -o table
```

- Create a storage account
```bash
az storage account create --name mystorageaccount123 --resource-group myResourceGroup --location mylocation --sku Standard_LRS
```
  - Nb: Name must be globally unique, lowercase, 3–24 characters.
  
- Get the ConnectionString
 ```bash
az storage account show-connection-string  --name mystorageaccount123   --resource-group myResourceGroup
```
2. Settings
Set the following Environment variables for the Function project:
- TABLES_CONNECTION
  - The connection-string as above
Throughot all folder serach for, and replace with actual value:
- THE_AZURE_FUNCTION_NAME
  - That is the project name, not emoji
- FUNCTION_KEY
- 

4. Start the Azure Function  
Open the **VotesSurveyFn** project in VS or VS Code, build and run it

5. In ```VotesBlogSite\VotesBlog``` folder run
```bash
 bundle exec jekyll serve
 ```
## Further
Once you get this running deploy to the Function to Azure, and use the files in BlogFiles in your Jekyll site.
Need to configure for:
- Azure Function URl and credentials

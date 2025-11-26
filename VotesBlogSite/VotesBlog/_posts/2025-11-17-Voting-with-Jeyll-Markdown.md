---
layout: post
title:  "Voting with Jekyll-Markdown"
date:   2025-11-17 13:21:27 +1100
categories: jekyll voting
---

Jekyll-Markdown is compiled and deployed as a static web site. Sample code and example.
<!--more-->


<hr style="border: none; border-top: 4px double #333; width: 100%;">

## A Sample Voting Implementation

{% comment %}
 With deployment to Azure replace api below with your function URL, for example:
 api="https://THE_AZURE_FUNCTION_NAME.azurewebsites.net/api/emoji
{% endcomment %}


{% assign api_endpoint = site.gAPI | default: 'emoji' %}

{% assign api_url = 'http://localhost:' | append: site.gLOCALHOST_PORT | append: '/api/' | append: api_endpoint %}

{% include votes.html
   id=site.gSURVEY_ID
   api=api_url
   code=site.gYOUR_FUNCTION_KEY
   key=page.url %}
   


{% include clear-votes.html %} 

<hr style="border: none; border-top: 4px double #333; width: 100%;">

## Further Reading

[See blog post](https://davidjones.sportronics.com.au/appdev/athstitcher-Features_not_yet_included-appdev.html)


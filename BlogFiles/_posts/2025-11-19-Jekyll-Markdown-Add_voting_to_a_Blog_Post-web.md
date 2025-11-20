---
layout: postpage
title: Jekyll-Markdown
subtitle: Add voting to a Blog Post
category: web
tags: jekyll web markdown azurefunction survey voting state
date: 2025-11-19 16:56:03
author: david_jones
excerpt_separator: <!--more-->
disqus: 1
---

Jekyll-Markdown is compiled and deployed as a static web site. So how can you add voting functionality to a blog post?
<!--more-->

One approach is to use an external service, such as Azure Functions, to handle the voting logic. This way, you can keep your Jekyll site static while still providing dynamic functionality.

Here's a high-level overview of the steps involved:


1. **Voting Options**: Define the voting options you want to present to users in a yaml file in the `_data` folder of your Jekyll site. This makes it easy to manage and update the options. 
    - Structure of the yml  file is name and value pairs.
2. **Create an Azure Function**: This function will handle the voting logic, including recording votes and getting tallies.
3. **Integrate the Function with Your Blog**: Use JavaScript to call the Azure Function from your blog posts.     
    - You can create a simple voting interface as an included HTML page
    - This page iterates through the list of voting options from the yaml file and displays them as buttons or links.
4. **Display Voting Results**: After a user votes, you can update the UI to show the current vote tally without requiring a page refresh upon submitting a vote
5. **Include the voting interface** ... in your blog posts using Jekyll's include functionality.
6. **Store Voting Data**: Use an Azure Blob Storage to store voting data. 
    - Each vote can be recorded in a blob, and the Azure Function can read from and write to this blob as needed. 
    - Configure to only show votes if tally is non zero; alternative, only show votes if voted locally.
7. **Implement Voting Logic**: Use Javascript in the blog post where the voting occurs to restrict votes to one per user using LocalStorage to track if a user has voted.


    -  _Actually implement an automatic page refresh._
8. **For development purposes** Include a Powershell script to clear the votes in the Blob Storage
    - and Javascript to to clear the localStorage data of voting, so that can send another vote.Sample

<hr style="border: none; border-top: 4px double #333; width: 100%;">

## A Sample Voting Implementation

{% include votes.html
   id="vote_survey"
   api="https://djssurveyfn.azurewebsites.net/api/emoji"
   code="kNPmcoDX5aMLqJOJa2WXNOSAg23j7WzRc2ceEI8cqcEBAzFuqU5fRw=="
   key=page.url %}

{% include clear-votes.html %} 

<hr style="border: none; border-top: 4px double #333; width: 100%;">

By following the steps as above, you can add a voting feature to your Jekyll blog posts while keeping the site static and fast.

## 1. A Sample .yml page for voting options

```yaml
- - 'option1'
  - 'The quick brown'
- - 'option2'
  - 'Jumps over the lazy dog'
- - 'option3'
  - 'To be, or not to be:'
- - 'option4'
  - 'That is the question'
- - 'option5'
  - 'En un lugar de la Mancha'
- - 'option6'
  - 'Once upon a time'
```
***_data/votingoptions.yml***

## 2. The Azure Function
See the code repository [here](https://github.com/your-repo) for the Azure Function project that handles the voting logic. This function will receive votes from the blog post, update the vote counts in Azure Blob Storage, and return the current tallies when requested.

## 3. The HTML Include file for voting

```liquid
{% raw %}
<div class="survey" data-id="{{ include.id | default: 'The quick brown' }}" data-ns="{{ site.title | default: 'option1' | slugify }}" data-api="{{ include.api | default: '' }}" data-key="{{ include.key | default: page.url }}" data-code="{{ include.code | default: '' }}">
  <h2>Votes Survey</h2>
  <h3>Q. What do you want to do?</h3>
    <i>(Please Select one. Votes shown.)</i>
  <div class="survey-options">
    <ul>
    {% assign options = site.data.voteoptions %}
    {% if options %}
      {% for pair in options %}
        {% assign opt = pair[0] %}
        {% assign label = pair[1] %}
        <li><button class="survey-opt" type="button" data-opt="{{ opt }}"><span class="survey-count" aria-hidden="true"></span> {{ label }}</button></li>
      {% endfor %}
    {% endif %}
    </ul>
  </div>
  <div class="survey-status" aria-live="polite"></div>
</div>
<script src="{{ '/assets/clientId.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/survey.js' | relative_url }}" defer></script>
<style>
{% endraw %}
```
***Part of the file _includes/votes.html***

> Note that it iterates through the name-value pairs in the .yml file. The value for each is displayed as a button. The name is what is submitted and stored as the vote.

## 4. The Name-Value Pairs in display loop

```liquid
{% raw %}
      {% for pair in options %}
        {% assign opt = pair[0] %}
        {% assign label = pair[1] %}
{% endraw %}
```

In the code above, the loop iterates through each pair in the `options` array, assigning the first element of the pair to `opt` which is what is sent to the backend end code and services. The second element in the pair is the `label` and is what is displayed on the buttons. These are defined in the .yml file except that the label has tallies prepended to it dynamically by the backend code (if non-zero).

## 5. Including the Voting in a Blog Post

````liquid
{% raw %}
{% include votes.html
   id="vote_survey"
   api="https://THE_AZURE_FUNCTION_NAME.azurewebsites.net/api/THE_SPECIFIC_API"
   code="BLOB_STORAGE_FUNCTION_KEY"
   key=page.url %}
{% endraw %}
```  
***Including the voting interface in a blog post***

> Note: CAPITALISED parts need to be replaced with your actual Azure Function details:

- When you create the Azure Function, the project name replaces **THE_AZURE_FUNCTION_NAME** above.
- **THE_SPECIFIC_API** is the specific function you create to handle the voting as a separate page in the project.
- Make sure that you use the Function Key not one of the others.

## 6. Store Voting Data

## 7. Implement Voting Logic

## 8. For Development Purposes, Clearing Votes

This is a PowerShell script to delete localStorage from the browser but NOT to clear the votes from the Azure Blob Storage. This enables you to retest voting from the same browser. There is also a button here for development purposes to clear the blob storage votes. _Both would not be made available in production._

```liquid
{% raw %}
{% include clear-votes.html %} 
{% endraw %}
```  
***The button to clear localStorage votes***

This is included in the blog post where the voting.html is included.

```liquid
<button type="button" class="btn btn-warning" id="clear-votes-btn">
    Clear Votes in Local Storage (Can vote again!)
</button>
<script src="{{ '/assets/js/clear-votes.js' | relative_url }}" defer></script>
```
***_include/clear-votes.html include file***










## Conclusion

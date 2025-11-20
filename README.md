# VotesJekyllMarkdown

Implementing voting on a Jekyll Blog Post page using an Azure Function and an Azure Blob Storage Table.

Repository is in 3 parts:
- VotesSurveyFn
  - The Azure Function
- BlogFiles
  - Code files from an existsing Blog site that implements the voting
    - Placed in the required folders.
- VotesBlogSite
  - A working Jekyll site In BloSite folder
    - Including Blog Site Files
    - Need
      - ```gem install bundler```
    - ```gem install jekyll```
    - To run ```bundle exec jekyll serve```

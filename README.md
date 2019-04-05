# Merge PDF

The server allows you to glue four pages on one page.

# Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

# How it works
The server uses clusters to optimize performance. To compress responses from the server, use expressjs/compression.
For bonding pdf used library HummusJS. Processing one request takes about 500ms. As the number of simultaneous requests increases to 50, the average processing time for one request increases to 15 seconds. NodeJS is not the best platform for such tasks.

### Installing
`npm install`

### Start 
`npm run start`

### Description
The server has one POST route:

`http://localhost:3000/merge`

Example request body: 

`{
base64Array: ['base64String', 'base64String', 'base64String', 'base64String',]
}`

Response is file.

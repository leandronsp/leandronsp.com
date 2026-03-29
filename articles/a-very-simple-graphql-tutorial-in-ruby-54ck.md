---
title: "A very simple GraphQL tutorial in Ruby"
slug: "a-very-simple-graphql-tutorial-in-ruby-54ck"
published_at: "2022-03-03 18:34:04Z"
language: "en"
status: "published"
tags: ["ruby", "graphql"]
---

According to Wikipedia

> GraphQL is an open-source data query and manipulation language for APIs, and a runtime for fulfilling queries with existing data.[2] GraphQL was developed internally by Facebook in 2012 before being publicly released in 2015

Unlike [REST](https://en.wikipedia.org/wiki/Representational_state_transfer), GraphQL aims to allow query manipulation from the client-side, thus leveraging on client which data they want to fetch/update. 

## REST or GraphQL?

Actually, using REST it's also possible to manipulate queries, but the client must send the desired parameters in the query string and the server must have its own implementation for *each endpoint*. 

There's no silver bullet, and the choice for either REST or GraphQL will depend on the application business domain. It's likely that some will find fit for using both in the application.

## How GraphQL works

Pretty much like REST, GraphQL runs over HTTP. A very simple GraphQL request/response could be:

```json
POST /graphql

{
    "query": "query { hello }"
}
```
Response:
```json
{
    "data": {
        "hello": "Hello World!"
    }
}
```
But what's the `query { hello }` value in the request? Is it a valid JSON value?

Yes, it is. But the value `query { hello }` must be **parsed** in the server-side into something *readable*, and performed against an existing *data schema*. 

Such *data schema* is a component of GraphQL, called **GraphQL schema**. All we need is a GraphQL schema definition, along with its type definitions and other specific functional components. 

How to use GraphQL in a Ruby application?

## Introducing graphql-ruby
[graphql-ruby](https://github.com/rmosolgo/graphql-ruby) is a Ruby gem that implements the GraphQL specification and functionalities. 

It basically parses the request query, performs the query against the definition schema and returns the result in JSON format.

## A simple Rack application
Let's omit the "Rack" functionality and focus only on the business. The action method could be implemented as follows:
```ruby
require 'rack'
require 'graphql'

class RackApp
  def call(env)
    request = Rack::Request.new(env)

    if request.request_method == 'POST' && 
                                  request.path == '/graphql'
      params         = request.params
      query          = params[:query]
      variables      = params[:variables]
      operation_name = params[:operationName]

      result = AppSchema.execute(query,
                                 variables: variables,
                                 context: {},
                                 operation_name: operation_name)

      [200, 
      { 'Content-Type' => 'application/json' },[result.to_json]]
    end
  end
end
```
The server receives the `query`, `variables` and `operationName` and perform them against the `AppSchema`. 

Let's see the `AppSchema` definition:
```ruby
class AppSchema < GraphQL::Schema
  mutation MutationType
  query QueryType
end
```
Our very simple schema only defines the *mutation and query types*. 

### GraphQL Query/Mutation
**Query** is an object used to perform queries, which means, when we want to read/fetch data only. 

**Mutation** is an object used to perform insert/update actions, which will "mutate" the data in our schema definition.

The `QueryType` and `MutationType` objects could be implemented in such a way:
```ruby
class QueryType < GraphQL::Schema::Object
  field :hello, String

  def hello
    "Hello World Query!"
  end
end
```
And the mutation type:
```ruby
class MutationType < GraphQL::Schema::Object
  field :hello, String

  def hello
    "Hello World Mutation!"
  end
end
```

## Putting all together

Now, time to perform the HTTP request `query`:
```json
POST /graphql

{ "query": "query { hello }" }
```
Response:
```json
{
    "data": {
        "hello": "Hello World Query!"
    }
}
```
And the HTTP request `mutation`:
```json
POST /graphql

{ "query": "mutation { hello }" }
```
Response:
```json
{
    "data": {
        "hello": "Hello World Mutation!"
    }
}
```

## Wrapping Up

This post was a simple tutorial on GraphQL using Ruby, trying to simplify the fundamentals by implementing a very basic GraphQL schema definition.

All the code written in this tutorial is hosted in [my Github account](https://github.com/leandronsp/graph-queue-hell-rb). 














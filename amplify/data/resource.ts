import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postAuthenticationFunction } from "../auth/post-authentication/resource";
const schema = a
  .schema({
    searchResult: a.customType({
      id: a.id(),
      name: a.string(),
      tags: a.string().array(),
      slug: a.string(),
      description: a.string(),
      createdAt: a.string(),
      updatedAt: a.string(),
    }),
    paginatedSearchResult: a.customType({
      results: a.ref("searchResult").array(),
      nextToken: a.string(),
    }),

    user: a
      .model({
        id: a
          .id()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.owner().to(["read"]),
          ]),
        username: a.string(),
        email: a.string(),
        displayName: a
          .string()
          .authorization((allow) => [
            allow.publicApiKey().to(["read"]),
            allow.owner().to(["read"]),
          ]),
        owner: a.string(),
        prompts: a
          .hasMany("prompt", "owner")
          .authorization((allow) => [allow.owner().to(["read"])]),
        projectRules: a
          .hasMany("projectRule", "owner")
          .authorization((allow) => [allow.owner().to(["read"])]),
        modelProviders: a
          .hasMany("modelProvider", "owner")
          .authorization((allow) => [allow.owner().to(["read"])]),
        models: a
          .hasMany("model", "owner")
          .authorization((allow) => [allow.owner().to(["read"])]),
      })
      .disableOperations(["subscriptions", "delete", "update"])
      .authorization((allow) => [allow.owner().to(["read"])]),

    prompt: a
      .model({
        id: a.id().required(),
        name: a.string().required(),
        slug: a.string(),
        description: a.string().required(),
        tags: a.string().array(),
        instruction: a.string().required(),
        sourceURL: a.string(),
        howto: a.string(),
        public: a.boolean(),
        owner: a.string().required(),
        author: a
          .belongsTo("user", "owner")
          .authorization((allow) => [allow.publicApiKey().to(["read"])]),
        copyCount: a.integer().default(0),
      })
      .secondaryIndexes((index) => [
        index("slug").queryField("listBySlug").name("slugIndex"),
        index("name").queryField("listByName").name("nameIndex"),
      ])
      .authorization((allow) => [
        allow.publicApiKey().to(["read"]),
        allow.authenticated().to(["read"]),
        allow.owner().to(["delete"]),
      ])
      .disableOperations(["subscriptions", "create", "update", "list"]),
    savePrompt: a
      .mutation()
      .arguments({
        id: a.id(),
        name: a.string().required(),
        description: a.string().required(),
        howto: a.string(),
        instruction: a.string().required(),
        tags: a.string().array(),
        public: a.boolean(),
        sourceURL: a.string(),
      })
      .returns(a.ref("prompt"))
      .authorization((allow) => [allow.authenticated()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("prompt"),
          entry: "./handler/savePrompt.js",
        }),
      ),
    copyPrompt: a
      .mutation()
      .arguments({
        id: a.id(),
      })
      .returns(a.ref("prompt"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("prompt"),
          entry: "./handler/incrementCopyCount.js",
        }),
      ),
    searchPrompts: a
      .query()
      .arguments({
        query: a.string(),
        tags: a.string().array(),
        nextToken: a.string(),
      })
      .returns(a.ref("paginatedSearchResult"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("prompt"),
          entry: "./handler/search.js",
        }),
      ),

    projectRule: a
      .model({
        id: a.id().required(),
        name: a.string().required(),
        slug: a.string().required(),
        description: a.string(),
        content: a.string().required(),
        tags: a.string().array(),
        public: a.boolean(),
        sourceURL: a.string(),
        owner: a.string().required(),
        author: a
          .belongsTo("user", "owner")
          .authorization((allow) => [allow.publicApiKey().to(["read"])]),
        copyCount: a.integer().default(0),
        downloadCount: a.integer().default(0),
      })
      .secondaryIndexes((index) => [
        index("slug").queryField("listRuleBySlug").name("slugIndex"),
        index("name").queryField("listRuleByName").name("nameIndex"),
      ])
      .authorization((allow) => [
        allow.publicApiKey().to(["read"]),
        allow.authenticated().to(["read"]),
        allow.owner().to(["delete"]),
      ])
      .disableOperations(["subscriptions", "create", "update", "list"]),
    saveProjectRule: a
      .mutation()
      .arguments({
        id: a.id(),
        name: a.string().required(),
        description: a.string().required(),
        content: a.string().required(),
        tags: a.string().array(),
        public: a.boolean(),
        sourceURL: a.string(),
      })
      .returns(a.ref("projectRule"))
      .authorization((allow) => [allow.authenticated()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("projectRule"),
          entry: "./handler/saveProjectRule.js",
        }),
      ),
    copyProjectRule: a
      .mutation()
      .arguments({
        id: a.id(),
      })
      .returns(a.ref("projectRule"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("projectRule"),
          entry: "./handler/incrementCopyCount.js",
        }),
      ),
    downloadProjectRule: a
      .mutation()
      .arguments({
        id: a.id(),
      })
      .returns(a.ref("projectRule"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("projectRule"),
          entry: "./handler/incrementDownloadCount.js",
        }),
      ),
    searchProjectRules: a
      .query()
      .arguments({
        query: a.string(),
        tags: a.string().array(),
        nextToken: a.string(),
      })
      .returns(a.ref("paginatedSearchResult"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("projectRule"),
          entry: "./handler/search.js",
        }),
      ),

    modelProvider: a
      .model({
        id: a.id().required(),
        name: a.string().required(),
        slug: a.string(),
        description: a.string().required(),
        website: a.url(),
        owner: a.string().required(),
        author: a
          .belongsTo("user", "owner")
          .authorization((allow) => [allow.publicApiKey().to(["read"])]),
        models: a.hasMany("model", "providerId"),
      })
      .secondaryIndexes((index) => [
        index("slug").queryField("listModelProviderBySlug").name("slugIndex"),
        index("name").queryField("listModelProviderByName").name("nameIndex"),
      ])
      .authorization((allow) => [
        allow.publicApiKey().to(["read"]),
        allow.authenticated().to(["read"]),
        allow.owner().to(["delete"]),
      ])
      .disableOperations(["subscriptions", "create", "update", "list"]),
    saveModelProvider: a
      .mutation()
      .arguments({
        id: a.id(),
        name: a.string().required(),
        description: a.string().required(),
        website: a.url(),
      })
      .returns(a.ref("modelProvider"))
      .authorization((allow) => [allow.authenticated()]) // TODO: admin
      .handler(
        a.handler.custom({
          dataSource: a.ref("modelProvider"),
          entry: "./handler/saveModelProvider.js",
        }),
      ),
    searchModelProviders: a
      .query()
      .arguments({
        query: a.string(),
        nextToken: a.string(),
      })
      .returns(a.ref("paginatedSearchResult"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("modelProvider"),
          entry: "./handler/searchWithoutPublicFilter.js",
        }),
      ),

    model: a
      .model({
        id: a.id().required(),
        name: a.string().required(),
        slug: a.string(),
        description: a.string().required(),
        documentationURL: a.url(),
        owner: a.string().required(),
        providerId: a.string().required(),
        provider: a.belongsTo("modelProvider", "providerId"),
        author: a
          .belongsTo("user", "owner")
          .authorization((allow) => [allow.publicApiKey().to(["read"])]),
      })
      .secondaryIndexes((index) => [
        index("slug").queryField("listModelBySlug").name("slugIndex"),
        index("name").queryField("listModelByName").name("nameIndex"),
      ])
      .authorization((allow) => [
        allow.publicApiKey().to(["read"]),
        allow.authenticated().to(["read"]),
        allow.owner().to(["delete"]),
      ])
      .disableOperations(["subscriptions", "create", "update", "list"]),
    saveModel: a
      .mutation()
      .arguments({
        id: a.id(),
        name: a.string().required(),
        description: a.string().required(),
        documentationURL: a.url(),
        providerId: a.string(),
      })
      .returns(a.ref("model"))
      .authorization((allow) => [allow.authenticated()]) // TODO: admin
      .handler(
        a.handler.custom({
          dataSource: a.ref("model"),
          entry: "./handler/saveModel.js",
        }),
      ),
    searchModels: a
      .query()
      .arguments({
        query: a.string(),
        nextToken: a.string(),
      })
      .returns(a.ref("paginatedSearchResult"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(
        a.handler.custom({
          dataSource: a.ref("model"),
          entry: "./handler/searchWithoutPublicFilter.js",
        }),
      ),
  })
  .authorization((allow) => [allow.resource(postAuthenticationFunction)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  name: "akkodis-prompt-hub",
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: { expiresInDays: 90 },
  },
});

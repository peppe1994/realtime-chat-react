const { GraphQLServer, PubSub } = require('graphql-yoga');

const messages = [];

//graphql schema
// ! means required
const typeDefs = `
    type Message {
        id: ID! 
        user: String!
        content: String!
    }

    type Query {
        messages: [Message!] 
    }

    type Mutation {
        postMessage(user: String!, content: String!): ID!
    }

    type Subscription {
        messages: [Message!] 
    }
`;

//function to add a new subscriber to the list
const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

//functions for get the data
const resolvers = {
    Query: {
        messages: () => messages,
    },
    Mutation: {
        postMessage: (parent, {user, content}) => {
            const id = messages.length;
            messages.push({
                id,
                user,
                content
            });
            subscribers.forEach((fn) => fn());
            return id;
        }
    },
    Subscription: {
        messages: {
            //list of subscriber
            subscribe: (parent, args, { pubsub:pb }) => {
                const channel = Math.random().toString(36).slice(2,15);
                onMessagesUpdates(() => pb.publish(channel, { messages }));//there is a new message
                setTimeout(() => pb.publish(channel, { messages }), 0);
                return pb.asyncIterator(channel);
            }
        }
    },
};
const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context:{pubsub} });

server.start(({port}) => {
    console.log(`Server start on http://localhost:${port}`);  
});
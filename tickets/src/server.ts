import mongoose from "mongoose";
import { randomBytes } from 'crypto';
import { app } from "./app";
import { get } from "config";
import { InternalErrorServer } from "@supeguitickets/common";
import { natsClient } from "./nats-client";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { OrderCancelledListener } from "./events/listeners/order-cancelled-listener";

const start = async() => {
  if (!get('jwtConfig.secretKey')) {
    throw new InternalErrorServer('Missing the configuration for the env variable JWT_KEY')
  }

  if (!get('mongo.uri')) {
    throw new InternalErrorServer('Missing the configuration for the env variable MONGO_URI')
  }

  if (!get('nats.clientID')) {
    throw new InternalErrorServer('Missing the configuration for the env variable MONGO_URI')
  }

  if (!get('nats.clusterID')) {
    throw new InternalErrorServer('Missing the configuration for the env variable MONGO_URI')
  }

  if (!get('nats.url')) {
    throw new InternalErrorServer('Missing the configuration for the env variable MONGO_URI')
  }

  try {
    await natsClient.connect(
      get('nats.clusterID'),
      get('nats.clientID'),
      get('nats.url')
    )

    natsClient.client.on('close', () => {
      console.log('NATS connection closed');
      process.exit();
    });
    process.on('SIGINT', () => natsClient.client.close());
    process.on('SIGTERM', () => natsClient.client.close());

    new OrderCreatedListener(natsClient.client).listen()
    new OrderCancelledListener(natsClient.client).listen()

    await mongoose.connect(get('mongo.uri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    console.log('Connected to MongoDB to the tickets db')
  } catch (error) {
    console.error(error)
  }

  app.listen(3002, () => {
    console.log(`Tickets service listening on port 3002...`)
  })
}

start()
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'product-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const sendProductMessage = async (eventType, productData) => {
  await producer.connect();
  await producer.send({
    topic: 'product-events',
    messages: [{ value: JSON.stringify({ eventType, productData }) }],
  });
  await producer.disconnect();
};

module.exports = {
  sendProductMessage,
};

const kafka = require('kafka-node');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const Order = require('./Order');  


const mongoUri = 'mongodb://localhost:27017/shop'; 
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));


const PROTO_PATH = './order.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const orderProto = grpc.loadPackageDefinition(packageDefinition).order;


const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const consumer = new kafka.Consumer(
  kafkaClient,
  [{ topic: 'order_topic', partition: 0 }],
  { autoCommit: true }
);


const grpcClient = new orderProto.OrderService('localhost:50052', grpc.credentials.createInsecure());

consumer.on('message', async function (message) {
  console.log('Message reçu:', message);

  const orderData = JSON.parse(message.value);


  const newOrder = new Order({
    customerName: orderData.customerName,
    totalAmount: orderData.totalAmount,
  });

  try {
    
    const savedOrder = await newOrder.save();
    console.log('Commande sauvegardée dans MongoDB:', savedOrder);

    grpcClient.processOrder(orderData, (error, response) => {
      if (error) {
        console.error('Erreur lors du traitement de la commande via gRPC:', error);
      } else {
        console.log('Commande traitée avec succès via gRPC:', response);
      }
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la commande dans MongoDB:', error);
  }
});

consumer.on('error', function (err) {
  console.error('Erreur du consommateur Kafka:', err);
});

console.log('Consumer Kafka démarré et en attente de messages...');

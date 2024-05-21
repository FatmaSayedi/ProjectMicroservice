const kafka = require('kafka-node');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './product.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const productProto = grpc.loadPackageDefinition(packageDefinition).product;


const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const consumer = new kafka.Consumer(
  kafkaClient,
  [{ topic: 'product_topic', partition: 0 }],
  { autoCommit: true }
);


const grpcClient = new productProto.ProductService('localhost:50051', grpc.credentials.createInsecure());

consumer.on('message', async function (message) {
  console.log('Message reçu:', message);

  
  const product = JSON.parse(message.value);


  grpcClient.addProduct(product, (error, response) => {
    if (error) {
      console.error('Erreur lors de l\'ajout du produit via gRPC:', error);
    } else {
      console.log('Produit ajouté avec succès:', response);
    }
  });
});

consumer.on('error', function (err) {
  console.error('Erreur du consommateur Kafka:', err);
});

console.log('Consumer Kafka démarré et en attente de messages...');

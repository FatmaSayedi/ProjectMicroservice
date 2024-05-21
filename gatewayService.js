const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendOrderMessage } = require('./OrderProducer');
const { sendProductMessage } = require('./ProductProducer');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const orderProtoDefinition = protoLoader.loadSync('./order.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const productProtoDefinition = protoLoader.loadSync('./product.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const orderProto = grpc.loadPackageDefinition(orderProtoDefinition).order;
const productProto = grpc.loadPackageDefinition(productProtoDefinition).product;

const orderClient = new orderProto.OrderService('localhost:50051', grpc.credentials.createInsecure());
const productClient = new productProto.ProductService('localhost:50052', grpc.credentials.createInsecure());

app.get('/order/:id', (req, res) => {
  const orderId = req.params.id;
  orderClient.GetOrder({ id: orderId }, (err, response) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(response.order);
  });
});

app.post('/order', (req, res) => {
  const { productId, quantity } = req.body;
  orderClient.CreateOrder({ productId, quantity }, (err, response) => {
    if (err) {
      return res.status(500).send(err);
    }
    sendOrderMessage('creation', response.order);
    res.json(response.order);
  });
});

app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  productClient.GetProduct({ id: productId }, (err, response) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(response.product);
  });
});

app.post('/product', (req, res) => {
  const { name, description, price } = req.body;
  productClient.CreateProduct({ name, description, price }, (err, response) => {
    if (err) {
      return res.status(500).send(err);
    }
    sendProductMessage('creation', response.product);
    res.json(response.product);
  });
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Gateway service is running on port ${PORT}`);
});

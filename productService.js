const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const Product = require('./Product');
const { sendProductMessage } = require('../ProductProducer');

mongoose.connect('mongodb://127.0.0.1:27017/products', { useNewUrlParser: true, useUnifiedTopology: true });

const productProtoPath = './product.proto';
const productProtoDefinition = protoLoader.loadSync(productProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const productProto = grpc.loadPackageDefinition(productProtoDefinition).product;

const productService = {
  GetProduct: async (call, callback) => {
    const productId = call.request.id;
    const product = await Product.findById(productId);
    if (!product) {
      return callback(new Error('Product not found'));
    }
    callback(null, { product });
  },

  CreateProduct: async (call, callback) => {
    const { name, description, price } = call.request;
    const newProduct = new Product({ name, description, price });
    const product = await newProduct.save();
    sendProductMessage('creation', product);
    callback(null, { product });
  },
};

const server = new grpc.Server();
server.addService(productProto.ProductService.service, productService);
server.bindAsync('0.0.0.0:3002', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Product Service running on port 3002');
  server.start();
});



const kafka = require('kafka-node');


const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(kafkaClient);

producer.on('ready', function () {
  console.log('Producteur Kafka prêt.');


  const order = {
    customerName: 'John Doe',
    totalAmount: 49.99
  };

  const payloads = [
    { topic: 'order_topic', messages: JSON.stringify(order), partition: 0 }
  ];

  producer.send(payloads, function (err, data) {
    if (err) {
      console.error('Erreur lors de l\'envoi de la commande:', err);
    } else {
      console.log('Commande envoyée avec succès:', data);
    }
    process.exit();
  });
});

producer.on('error', function (err) {
  console.error('Erreur du producteur Kafka:', err);
});

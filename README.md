# dropbox_Mongo

##Steps to run


Back-end server
	1. cd back-end
	2. npm install
	3. npm start

Front-end server
	1. cd reactlogin
	2. npm install
	3. npm start
  
Run Zookeeper and Kafka on your System.

  Create topics in Kafka:

kafka-topics.bat --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic login_topic

kafka-topics.bat --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic response_topic

kafka-topics.bat --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic file_topic

kafka-topics.bat --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic sharing_topic

	
	1. cd kafka-back-end
	2. npm install
	3. npm start



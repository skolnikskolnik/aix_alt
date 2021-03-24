drop database if exists aixTestData;

create database aixTestData;

use aixTestData;

create table clients(
id int not null auto_increment,
txn_date varchar(50),
txn_type varchar(50),
txn_shares int,
txn_price decimal(15,2),
fund varchar(50),
investor varchar(150),
advisor varchar(100),
primary key(id)
);

select*from clients;

select*from aixtestdata;

SELECT*FROM aixtestdata 
WHERE ADVISOR = 'Darryl "Moose" Johnston'
AND TXN_DATE CONTAINS "2019"; 




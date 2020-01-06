#!/usr/bin/env bash


function install_apache {
       sudo apt-get -y update && \
        sudo apt-get -y install apache2 && \
        sudo ufw allow 'Apache Full' && \
        sudo a2enmod rewrite
}

function install_php72 {
     sudo add-apt-repository ppa:ondrej/php && \
        sudo apt-get -y update && \
        sudo apt-get -y install php7.3 php7.3-common php7.3-curl php7.3-xml php7.3-zip php7.3-gd php7.3-mysql php7.3-mbstring && \
        sudo a2enmod php7.3 && \
        sudo service apache2 restart && \
        sudo apt-get install composer
}

function install_mysql {
     sudo apt-get -y install mysql-server && \
        echo 'mysql-server-5.7 mysql-server/root_password password root' | sudo debconf-set-selections && \
        echo 'mysql-server-5.7 mysql-server/root_password_again password root' | sudo debconf-set-selections && \
        sudo apt-get -y install mysql-server-5.7 mysql-client >> /dev/null && \
        sudo service mysql start 
}

install_apache
install_php72
install_mysql
#package_app
#echo $PASS_SQL
#echo $MYSQLPASSWORD

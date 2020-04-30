<?php


namespace App\Service;

use DateTimeZone;


class Datesorting
{
    public static function SorteDate(int $consomation,array $production){
        $start=0;
        $firstpart=[];

        $secondpart=[];
        $datecon=new \DateTime(null, new DateTimeZone('UTC'));
        $datecon->setTimestamp($consomation);
        for ($i=0;$i<count($production);$i++){
            $date = new \DateTime(null, new DateTimeZone('UTC'));
            $date->setTimestamp($production[$i][0]);
            if((int)$date->format('m')===(int)$datecon->format('m')){
                if ((int)$date->format('d')===(int)$datecon->format('d')){
                    if ((int)$date->format('H')===(int)$datecon->format('H')){
                        $start=$i;
                    }
                }
            }
        }
        $j=0;
        for ($i=$start;$i<count($production);$i++){
            $firstpart[$j]=$production[$i];
            $j++;
        }
        for ($i=0;$i<$start;$i++){

            $secondpart[$i]=$production[$i];
        }
        return array_merge($firstpart,$secondpart);

    }
}
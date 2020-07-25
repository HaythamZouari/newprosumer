<?php


namespace App\Service;

use DateTimeZone;
use Carbon\CarbonPeriod;


class Datesorting
{
    public static function SorteDate(int $consomation,array $production, array $dateconsommation){
        $start=0;
        $firstpart=[];
        $dateconsom=[];

        $secondpart=[];
        $datecon=new \DateTime(null);
        $datecon->setTimestamp($consomation);
        $dateFin= new \DateTime($datecon->format('y-m-d'));
        $dateFin->add(new \DateInterval('P1Y'));
        for ($i=0;$i<count($production);$i++){
            $date = new \DateTime(null);
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
            $dateconsom=$dateconsommation[$j][0];

            $firstpart[$j]=[$dateconsom,$production[$i][1]];

            $j++;
        }
        for ($i=0;$i<$start;$i++){
            $dateconsom=$dateconsommation[$j][0];

            $j++;
            $secondpart[$i]=[$dateconsom,$production[$i][1]];
        }
       
                    
        return array_merge($firstpart,$secondpart);

    }
}
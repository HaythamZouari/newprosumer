<?php


namespace App\Service;

use DateTimeZone;


class PostHoraire
{
    public static function PostHoraire(array $data){
        $month=[];
        for($i=0;$i<13;$i++){
            $month[$i]['jour']=0;
            $month[$i]['ete']=0;
            $month[$i]['soir']=0;
            $month[$i]['nuit']=0;

        }
        foreach ($data as $item) {
            $date = new \DateTime(null);
            $date->setTimestamp($item[0]);
            if(((int)$date->format('w'))==0)
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==1){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }
            elseif(((int)$date->format('d'))==14&&((int)$date->format('m'))==1){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }
            elseif(((int)$date->format('d'))==20&&((int)$date->format('m'))==3){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }
            elseif(((int)$date->format('d'))==9&&((int)$date->format('m'))==4){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }
            elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==5){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }
            elseif(((int)$date->format('d'))==25&&((int)$date->format('m'))==7){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }
            elseif(((int)$date->format('d'))==13&&((int)$date->format('m'))==8){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }
            elseif(((int)$date->format('d'))==15&&((int)$date->format('m'))==10){
                $month[((int)$date->format('m'))]['nuit']+=$item[1];
            }

            elseif (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
                
                if ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                    (int)$date->format('H')>21&&(int)$date->format('H')<=23){
                    $month[((int)$date->format('m'))]['nuit']+=$item[1];
                }
                elseif( (int)$date->format('H')>=7&&(int)$date->format('H')<=8 ||
                    (int)$date->format('H')>13&&(int)$date->format('H')<=18){
                    $month[((int)$date->format('m'))]['jour']+=$item[1];
                }
                elseif ((int)$date->format('H')>=9&&(int)$date->format('H')<=13){
                    $month[((int)$date->format('m'))]['ete']+=$item[1];
                }
                else
                    $month[((int)$date->format('m'))]['soir']+=$item[1];
            }
            else{
                if( (int)$date->format('H')>=7&&(int)$date->format('H')<=17){
                    $month[((int)$date->format('m'))]['jour']+=$item[1];
                }
                elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                    (int)$date->format('H')>=21&&(int)$date->format('H')<=23){
                    $month[((int)$date->format('m'))]['nuit']+=$item[1];
                }
                else{
                    $month[((int)$date->format('m'))]['soir']+=$item[1];
                }
            }
        }
        return $month;
    }
}
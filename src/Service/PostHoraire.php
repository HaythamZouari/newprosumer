<?php


namespace App\Service;


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
            $date = new \DateTime();
            $date->setTimestamp($item[0]);
            if (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
                if( (int)$date->format('H')>=7&&(int)$date->format('H')<=8 ||
                    (int)$date->format('H')>13&&(int)$date->format('H')<=18){
                    $month[((int)$date->format('m'))]['jour']+=$item[1];
                }
                elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                    (int)$date->format('H')>21&&(int)$date->format('H')<=23){
                    $month[((int)$date->format('m'))]['nuit']+=$item[1];
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
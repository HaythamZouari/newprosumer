<?php


namespace App\Service;
use DateTime;
use PhpOffice\PhpSpreadsheet\Reader\Csv as ReaderCsv;
use PhpOffice\PhpSpreadsheet\Reader\Ods as ReaderOds;
use PhpOffice\PhpSpreadsheet\Reader\Xls as ReaderXls;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx as ReaderXlsx;


class ExcelReader
{
    static private function readFile($filename)
    {
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        switch ($extension) {
            case 'ods':
                $reader = new ReaderOds();
                break;
            case 'xlsx':
                $reader = new ReaderXlsx();
                break;
            case 'csv':
                $reader = new ReaderCsv();
                break;
            default:
                $reader = new ReaderXls();
        }
        $reader->setReadDataOnly(true);
        return $reader->load($filename);
        return $extension;
    }
    static private function frenshdate(string $date){
        $months = ['janvier',
            'février',
            'mars',
            'avril',
            'mai',
            'juin',
            'juillet',
            'août',
            'septembre',
            'octobre',
            'novembre',
            'décembre',
        ];
        $date1 = explode(" ",$date);
        $finaldate=0;
        for ($i=0;$i<12;$i++){
            if ($months[$i]==$date1[2]){
                $finaldate=($i+1);
            }
        }
        $finaldate =$finaldate."/".$date1[1]."/".$date1[3];
        return $finaldate;
    }

    static public function createDataFromSpreadsheet(string $filename)
    {
        $worksheetit=0;
        $spreadsheet = ExcelReader::readFile($filename);
        $data =[];
        $numsheet = $spreadsheet->getSheetCount();

        if($numsheet===2){ /*si le nombre de feuilles du fichier eexcel est egal à 2 */
            foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
                $worksheetit++; 
                if ($worksheetit ==2){ /*à la deuxiéme feuille*/
                    foreach ($worksheet->getRowIterator() as $row) {
                        $rowIndex = $row->getRowIndex(); /*$rowindex c'est le numéro de la ligne*/
                        $cellIterator = $row->getCellIterator(); /* $celliterator pour lire toutes lees cellules de la feuille car il y'a des cellules vide*/
                        $cellIterator->setIterateOnlyExistingCells(false); // Loop over all cells, even if it is not set
                        $val = 0; /* $val c'est un compteur pour les colonnes*/
                        $i=0;
                        foreach ($cellIterator as $cell) {
                            if ($rowIndex >= 1 ) { /* si le numéro de la ligne est supérieur à 1 */
                                if($val < 4) { 
                                    if ($val !=3) /* si la colonne est entre 0 et 2*/
                                        $data[$val][] = $cell->getFormattedValue(); /* remplir data avec les données des cellules excel de la ligne rang val*/
                                    $val = $val + 1;
                                }
                            }
                        }
                    }

                }
            }
            $data[2] = array_map('floatval', $data[2]); /*floatval retour le nombre relatif au contenu de $data[2] les valeur de puissance est array-map leurs donne des key*/
            $data1=[];
            $datevoid=$data[0][1];
            foreach (array_keys($data[0]) as $key) {
                if (!empty($data[0][$key])){ /* data[0] c'est la colonne qui contient les valeurs des dates chaque jour une valeur*/
                    $datevoid=$data[0][$key];
                }
                if ($key>0){
                    $min=explode(":",$data[1][$key]);
                    if ($min[1]=="10"){ /* min[1] contient les valeurs des des heures XX:10*/
                      /*  if(($key%6)==1){ j'ai supprimé cette condition car si la courbe contient des coupures alors stistfaire cette condition et la condition précédente va rendre les itération fausses*/
                            $data[0][$key]=DateTime::createFromFormat('d/m/Y H:i',$datevoid." ".$data[1][$key])->getTimestamp();
                            $data1[$i]=[$data[0][$key],$data[2][$key]];
                            $i++;
                       /* }*/

                    }
                }

            }
        }
        if($numsheet>2){
            foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
                $worksheetit++;
                if ($worksheetit >=2){
                    foreach ($worksheet->getRowIterator() as $row) {
                        $rowIndex = $row->getRowIndex();
                        $cellIterator = $row->getCellIterator();
                        $cellIterator->setIterateOnlyExistingCells(false); // Loop over all cells, even if it is not set
                        $val = 0;
                        $i=0;
                        foreach ($cellIterator as $cell) {
                            $colIndex=$cell->getcolumn();
                            if ($rowIndex >= 1 ) {
                                if($val < 3) 
                                    
                                    $data[$val][] = $cell->getFormattedValue();
                                    $val = $val + 1;
                            }
          
                        }
                       if ($rowIndex >= 1) {
                        $data[3][]= ExcelReader::frenshdate($worksheet->getTitle());
                        $rowIndex=$rowIndex+1;
                       }
                    }
                }
            }
            $data[5]=$data[0];
            $data[0] = array_map('floatval', $data[0]);
            $data[1] = array_map('floatval', $data[1]);
            $data5=[];
            $data1=[];
            $data2=[];
            $data4=[];
            $X=[];
            foreach (array_keys($data[0]) as $key) {
               
               if((round($data[0][$key]*144)%6)==1){
              
                    $X=round(($data[0][$key]*144))%6;
                    $data5=$data[0][$key];
                    $data[3][$key]=(new DateTime($data[3][$key]))->getTimestamp();
                    $data2=$data[3][$key];
                    $data[3][$key]=$data[3][$key]+($data[0][$key]* 86400);
                    $data1[$i]=[$data[3][$key],$data[1][$key],$key,$data2,$data5,$X];
                    $i++;
                
                }
            }
        }
      
        else if ($numsheet===1){
            foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
                $worksheetit++;
                foreach ($worksheet->getRowIterator() as $row) {
                    $rowIndex = $row->getRowIndex();
                    $cellIterator = $row->getCellIterator();
                    $cellIterator->setIterateOnlyExistingCells(false); // Loop over all cells, even if it is not set
                    $val = 0;
                    $i=0;
                    foreach ($cellIterator as $cell) {
                        if ($rowIndex >= 1 ) {
                            if($val < 4) {
                                if ($val !=2)
                                    $data[$val][] = $cell->getFormattedValue();
                                $val = $val + 1;
                            }
                        }
                    }
                }
            }
            $data[3] = array_map('floatval', $data[3]);
            $data1=[];
            $data6=[];
            $data7=[];
            foreach (array_keys($data[0]) as $key) {
                    $data6[$key]=DateTime::createFromFormat('d/m/Y H:i', $data[0][$key] . " " . $data[1][$key]);
                    
                    
                        if(($key%6)==2) {

                                
                            if ((is_float( $data6[$key]))||(is_bool( $data6[$key]))){
                                $data[0][$key]=(($data[0][$key] - 25569+($data[1][$key])) * 86400);
                                $data1[$i][]=$data[0][$key];
                                $data1[$i][]=$data[3][$key];
                                $i++;
                          
                            }/*

                            elseif(is_bool( $data6[$key])){
                                $data1[$i][]=0 ;

                            }*/
                            else{
                                
                             $data1[] =[ DateTime::createFromFormat('d/m/Y H:i', $data[0][$key] . " " . $data[1][$key])->getTimestamp(),$data[3][$key]];
                             
                                
                            }
                        }
            }    
                
            
        }

        return $data1;
    }
}
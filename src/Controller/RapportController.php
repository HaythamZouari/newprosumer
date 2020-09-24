<?php

namespace App\Controller;

use Dompdf\Options;
use App\Entity\Project;
use App\Service\PostHoraire;
use App\Service\Horaireannuel;
use App\Service\FinanceService;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;


class RapportController extends AbstractController
{
    /**
     * @Route("/rapport/{id}", name="rapport")
     */
    public function index(Project $project)
    {
        $TarifSouscrit='';
        if ($project->getConsomation()->getTypeTarif())
            $TarifSouscrit = "Postes Horaires";
        else {
            $TarifSouscrit="Uniforme";
        }

        if($project->getCsvProd()!=null){
            $degradation=$project->getCsvProd()->getDegradation();
        }
        if($project->getPvgis()!=null)
            $degradation=$project->getPvgis()->getDegradation();
        if($project->getNinja()!=null)
            $degradation=$project->getNinja()->getDegradation();


        $incl=0;
        $cm_annuel=[];
        $a_cm_annuel=[];
        $factureannuel=[];
        $prd_annuel=0;
        $cedee_annuel=0;
        $ps_centrale=0;
        $lat=0;
        $lon=0;
        $azimut=0;
        $prod25ans=0;
        $loss=0;

        if($project->getPvgis()!=null){
            for ($i=0;$i<count($project->getPvgis()->getResult());$i++) {
               $prd_annuel+= $project->getPvgis()->getResult()[$i][1];
            }
            $prodvalue= $project->getPvgis()->getResult();
            $ps_centrale=$project->getPvgis()->getPeakPower()[0]+$project->getPvgis()->getPeakPower()[1]+$project->getPvgis()->getPeakPower()[2];
            $lat=$project->getPvgis()->getLat();
            $lon=$project->getPvgis()->getLon();
            $azimut=$project->getPvgis()->getAzimuth()[0];
            $azimut1=$project->getPvgis()->getAzimuth()[1];
            $azimut2=$project->getPvgis()->getAzimuth()[2];
            

            $incl = $project->getPvgis()->getSlop()[0];
            $incl1 = $project->getPvgis()->getSlop()[1];
            $incl2 = $project->getPvgis()->getSlop()[2];
            $pschamp=$project->getPvgis()->getPeakPower()[0];
            $pschamp1=$project->getPvgis()->getPeakPower()[1];
            $pschamp2=$project->getPvgis()->getPeakPower()[2];
            
            $loss=$project->getPvgis()->getLoss();
        }

        if($project->getNinja()!=null){
            for ($i=0;$i<count($project->getNinja()->getResult());$i++) {
               $prd_annuel+= $project->getNinja()->getResult()[$i][1];
            }
            $incl1 = 0;
            $incl2 = 0;
            $azimut1=0;
            $azimut2=0;
            $pschamp=0;
            $pschamp1=0;
            $pschamp2=0;

            $prodvalue= $project->getNinja()->getResult();
            $ps_centrale=$project->getNinja()->getCapacity();
            $lat=$project->getNinja()->getLat();
            $lon=$project->getNinja()->getLon();
            $azimut=$project->getNinja()->getAzimuth();
            $incl = $project->getNinja()->getTilt();
            $loss=$project->getNinja()->getLoss();
        }
        else if($project->getCsvProd()!=null){
            $incl1 = 0;
            $incl2 = 0;
            $azimut1=0;
            $azimut2=0;
            $pschamp=0;
            $pschamp1=0;
            $pschamp2=0;

            for ($i=0;$i<count($project->getCsvProd()->getResult());$i++) {
                $prd_annuel+= $project->getCsvProd()->getResult()[$i][1];
            }
            $prodvalue= $project->getCsvProd()->getResult();
            $ps_centrale=$project->getCsvProd()->getPuissence();
        }
        for ($i=0;$i<25;$i++){
            $prod25ans+=(float)($prd_annuel-($prd_annuel*((pow( $degradation,$i))/100)));
        }
        $productible=$prd_annuel/$ps_centrale;
        $gain_cedeetot=0;
        $gain_transptot=0;


        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){
            $cm_annuel[$j]=0;
            $a_cm_annuel[$j]=0;
            $imp_annuel[$j]=0;
            $taux_auto[$j]=0;
            $factureannuel[$j]=0;

        }



        
     
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   
            $autconsommePHTotps[$j]['jour']=0;
            $autconsommePHTotps[$j]['ete']=0;
            $autconsommePHTotps[$j]['soir']=0;
            $autconsommePHTotps[$j]['nuit']=0;

            $ImportePHTotps[$j]['jour']=0;
            $ImportePHTotps[$j]['ete']=0;
            $ImportePHTotps[$j]['soir']=0;
            $ImportePHTotps[$j]['nuit']=0;
            
            $consommationPHTotps[$j]['jour']=0;
            $consommationPHTotps[$j]['ete']=0;
            $consommationPHTotps[$j]['soir']=0;
            $consommationPHTotps[$j]['nuit']=0;

        }
        

        for($i=0;$i<13;$i++){
                
            $CedePH[$i]['jour']=0;
            $CedePH[$i]['ete']=0;
            $CedePH[$i]['soir']=0;
            $CedePH[$i]['nuit']=0; 
            
           
            $autconsommePHTot[$i]['jour']=0;
            $autconsommePHTot[$i]['ete']=0;
            $autconsommePHTot[$i]['soir']=0;
            $autconsommePHTot[$i]['nuit']=0;
        }
        for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++){ 

            $Cedetot[$i][1]=0;
            $Cedetot[$i][0]=0;
    
        }

        if (count($project->getConsomation()->getallConsomationAnnuel())>1){

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
                
                for($i=1;$i<13;$i++){
                    $CedePH[$i]['jour']+= $project->getcedeePH()[$j][$i]['jour'];
                    $CedePH[$i]['ete']+= $project->getcedeePH()[$j][$i]['ete'];
                    $CedePH[$i]['soir']+= $project->getcedeePH()[$j][$i]['soir'];
                    $CedePH[$i]['nuit']+= $project->getcedeePH()[$j][$i]['nuit'];                  
        
                }
            }
            for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++){ 
                for ($j=1;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 

                $Cedetot[$i][1]+=$project->getCedee()[$j][$i][1];
                $Cedetot[$i][0]= $project->getConsomation()->getallConsomationAnnuel()[0][$i][0];
                }
                
            }   
            for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++){ 
                $Cedetot[$i]=[$project->getConsomation()->getallConsomationAnnuel()[0][$i][0],$Cedetot[$i][1]];

            }
        }
        else{
            $CedePH=$project->getinjectPH();
            $Cedetot=$project->getinject();
        }


        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
            
            for($i=1;$i<13;$i++){
                $autconsommePHTot[$i]['jour']+= $project->getauto_consomerPH()[$j][$i]['jour'];
                $autconsommePHTot[$i]['ete']+= $project->getauto_consomerPH()[$j][$i]['ete'];
                $autconsommePHTot[$i]['soir']+= $project->getauto_consomerPH()[$j][$i]['soir'];
                $autconsommePHTot[$i]['nuit']+= $project->getauto_consomerPH()[$j][$i]['nuit'];                  
    
            }
        }

        

        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 

            for($i=0;$i<13;$i++){
                $autconsommePHTotps[$j]['jour']+= $project->getauto_consomerPH()[$j][$i]['jour'];
                $autconsommePHTotps[$j]['ete']+= $project->getauto_consomerPH()[$j][$i]['ete'];
                $autconsommePHTotps[$j]['soir']+= $project->getauto_consomerPH()[$j][$i]['soir'];
                $autconsommePHTotps[$j]['nuit']+= $project->getauto_consomerPH()[$j][$i]['nuit'];
                
                

                $ImportePHTotps[$j]['jour']+= $project->getimporterPH()[$j][$i]['jour'];
                $ImportePHTotps[$j]['ete']+= $project->getimporterPH()[$j][$i]['ete'];
                $ImportePHTotps[$j]['soir']+= $project->getimporterPH()[$j][$i]['soir'];
                $ImportePHTotps[$j]['nuit']+= $project->getimporterPH()[$j][$i]['nuit'];  
                
                $consommationPHTotps[$j]['jour']+= $project->getconsomationPH()[$j][$i]['jour'];
                $consommationPHTotps[$j]['ete']+= $project->getconsomationPH()[$j][$i]['ete'];
                $consommationPHTotps[$j]['soir']+= $project->getconsomationPH()[$j][$i]['soir'];
                $consommationPHTotps[$j]['nuit']+= $project->getconsomationPH()[$j][$i]['nuit'];    
    
            }
        }


        $auto_consomer_postHor[0]=0;
        $auto_consomer_postHor[1]=0;
        $auto_consomer_postHor[2]=0;
        $auto_consomer_postHor[3]=0;
        foreach ($autconsommePHTot as $tmp) {
            $auto_consomer_postHor[0]+=$tmp['jour'];
            $auto_consomer_postHor[1]+=$tmp['ete'];
            $auto_consomer_postHor[2]+=$tmp['soir'];
            $auto_consomer_postHor[3]+=$tmp['nuit'];

        }

           



            /************************************************************** */

     
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){
            $cm_annuel[$j]=0;
            $a_cm_annuel[$j]=0;
            $imp_annuel[$j]=0;
            $taux_auto[$j]=0;

        }


        $gain_cedeetot=0;
        $gain_transptot=0;
        
       
 
    $productiontotPH['jour']=0;
    $productiontotPH['ete']=0;
    $productiontotPH['soir']=0;
    $productiontotPH['nuit']=0;
    for($i=0;$i<13;$i++){
        $productiontotPH['jour']+= $project->getproductionPH()[$i]['jour'];
        $productiontotPH['ete']+= $project->getproductionPH()[$i]['ete'];
        $productiontotPH['soir']+= $project->getproductionPH()[$i]['soir'];
        $productiontotPH['nuit']+= $project->getproductionPH()[$i]['nuit'];
    }

    $cedee_postH[0]=0;
    $cedee_postH[1]=0;
    $cedee_postH[2]=0;
    $cedee_postH[3]=0;
    foreach ($CedePH as $tmp) {
        $cedee_postH[0]+=$tmp['jour'];
        $cedee_postH[1]+=$tmp['ete'];
        $cedee_postH[2]+=$tmp['soir'];
        $cedee_postH[3]+=$tmp['nuit'];
    }
            
    
    

    $cedee_annuel=$cedee_postH[0]+$cedee_postH[1]+$cedee_postH[2]+$cedee_postH[3];  


$PH_consomation=[];
$PH_auto_consomer=[];
$PH_importer=[];




$PH_consomation=$project->getconsomationPH();

$PH_auto_consomer=$project->getauto_consomerPH();
    
$PH_importer=$project->getimporterPH();
for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){                  
    for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++) {
        $cm_annuel[$j]+= $project->getConsomation()->getallConsomationAnnuel()[$j][$i][1];
    }
}  


for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   

    $PH_consomationannuel[$j]=$consommationPHTotps[$j];
    
    $PH_auto_consomerannuel[$j]=$autconsommePHTotps[$j];
        
    $PH_importerannuel[$j]=$ImportePHTotps[$j];


    $a_cm_annuel[$j]=$autconsommePHTotps[$j]['jour']+$autconsommePHTotps[$j]['ete']+$autconsommePHTotps[$j]['soir']+$autconsommePHTotps[$j]['nuit'];
        $taux_auto[$j]=(float)($a_cm_annuel[$j]/$cm_annuel[$j]);
        $imp_annuel[$j]=(float)($cm_annuel[$j]-$a_cm_annuel[$j]);

}

           

if($project->getConsomation()->getTypeTarif()==0){

             
    for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
        $g_E_transporterSite[$j] =FinanceService::gainEnergieTransporterUnif($project->getfinance()->getTarifUni(),$project,$project->getAutoConsomer()[$j]);
        $factureannuel[$j]=$cm_annuel[$j]*$project->getFinance()->getTarifUni();
    }    
    
    
    
}
else{
   
    for ($k=0;$k<count($project->getConsomation()->getallConsomationAnnuel());$k++){   

       
            $auto_consomer_postHor[0]=$autconsommePHTotps[$k]['jour'];
            $auto_consomer_postHor[1]=$autconsommePHTotps[$k]['ete'];
            $auto_consomer_postHor[2]=$autconsommePHTotps[$k]['soir'];
            $auto_consomer_postHor[3]=$autconsommePHTotps[$k]['nuit'];

            $consomer_postHor[$k][0]=$consommationPHTotps[$k]['jour'];
            $consomer_postHor[$k][1]=$consommationPHTotps[$k]['ete'];
            $consomer_postHor[$k][2]=$consommationPHTotps[$k]['soir'];
            $consomer_postHor[$k][3]=$consommationPHTotps[$k]['nuit'];

        

        for($j=0;$j<30;$j++){
            $result[$j]=0;
            for ($i= 0 ;$i<4;$i++){
                $result[$j]+= ($auto_consomer_postHor[$i]*
                    pow((1-($degradation/100)),$i)*
                    $project->getFinance()->getTarifHoraire()['achat'][$i]*
                    pow((1+($project->getFinance()->getAugTarifAchat()/100)),$j));
            }
            $g_E_transporterSite[$k][$j] = $result[$j];
        }

        for ($i = 0; $i < 4; $i++) {
            $factureannuel[$k] += $consomer_postHor[$k][$i]*
                $project->getFinance()->getTarifHoraire()['vende'][$i];
                
        }
        
    }
    
   

}


$f_reg=$project->getFinance()->getFRegularisation()[1];

for($i=0;$i<(count($project->getFinance()->getGainTransporter()));$i++){
    $f_transport[]=$project->getFinance()->getfactransport()[$i];
}
   
        $month=[];
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
            for($i=0;$i<13;$i++){
                $month[$j][$i]['jour']=0;
                $month[$j][$i]['ete']=0;
                $month[$j][$i]['soir']=0;
                $month[$j][$i]['nuit']=0;
                $month[$j][$i]['total']=0;
                
            }
        }   
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){  

        $month[$j]=$project->getconsomationPH()[$j];
    
        }

        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
            for($i=0;$i<13;$i++){

        $month[$j][$i]['total']= $month[$j][$i]['jour']+$month[$j][$i]['ete']+$month[$j][$i]['soir']+$month[$j][$i]['nuit'];

                
            }
        }   
        return $this->render('rapport/index.html.twig', [

            'cmmonth'=>$month,
            'loss'=>$loss,
            'incl'=>$incl,
            'incl1'=>$incl1,
            'incl2'=>$incl2,
            'f_r'=>$f_reg,
            'facture_annuel'=>$factureannuel,
            'tri'=>$project->getFinance()->getTri25(),
            'co2evite'=>($prod25ans*(0.57/1000)),
            'productible'=>$productible,
            'prod25ans'=>$prod25ans,
            'azim'=>$azimut,
            'azim1'=>$azimut1,
            'azim2'=>$azimut2,
            'lat'=>$lat,
            'lon'=>$lon,
            'puissance_centrale'=>$ps_centrale,
            'pschamp'=>$pschamp,
            'pschamp1'=>$pschamp1,
            'pschamp2'=>$pschamp2,
            'project'=>$project,
            'cm_annual'=>$cm_annuel,
            'finance'=>$project->getFinance(),
            'consomation'=>$project->getConsomation(),
            'T_autoC'=>$taux_auto,
            'degradation'=>$degradation,
            'T_cedee'=>(float)($cedee_annuel/$prd_annuel),
            'typeTarif'=>$TarifSouscrit,
            'coutproj'=>($project->getFinance()->getDepense()+$project->getFinance()->getCapex()-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention()),
            'lcoe'=>(($project->getFinance()->getDepense()+$project->getFinance()->getCapex())-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention())/$prod25ans,
            'relpin'=>$project->getFinance()->getReplinv(),
        ]);

    }
}

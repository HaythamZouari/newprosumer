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



        
                /**********************calcul pour tarif horaire*****************/
                $lastit=count($project->getConsomation()->getallConsomationAnnuel())-1;
                

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   
                    $autconsommePHTotps[$j]['jour']=0;
                    $autconsommePHTotps[$j]['ete']=0;
                    $autconsommePHTotps[$j]['soir']=0;
                    $autconsommePHTotps[$j]['nuit']=0;

                    $ImportePHTotps[$j]['jour']=0;
                    $ImportePHTotps[$j]['ete']=0;
                    $ImportePHTotps[$j]['soir']=0;
                    $ImportePHTotps[$j]['nuit']=0;


                for($i=0;$i<13;$i++){
                    $autconsommePH[$j][$i]['jour']=0;
                    $autconsommePH[$j][$i]['ete']=0;
                    $autconsommePH[$j][$i]['soir']=0;
                    $autconsommePH[$j][$i]['nuit']=0; 

                    $CedePH[$j][$i]['jour']=0;
                    $CedePH[$j][$i]['ete']=0;
                    $CedePH[$j][$i]['soir']=0;
                    $CedePH[$j][$i]['nuit']=0; 
                    
                    $ImportePH[$j][$i]['jour']=0;
                    $ImportePH[$j][$i]['ete']=0;
                    $ImportePH[$j][$i]['soir']=0;
                    $ImportePH[$j][$i]['nuit']=0;
                    
                    $autconsommePHTot[$i]['jour']=0;
                    $autconsommePHTot[$i]['ete']=0;
                    $autconsommePHTot[$i]['soir']=0;
                    $autconsommePHTot[$i]['nuit']=0;

                    


                }
            }

            if (($project->getConsomation()->getTransportEng())==false){
                $autconsommePH[0]=PostHoraire::PostHoraire($project->getConsomation()->getallConsomationAnnuel()[0]);
                $consommationPH[0]=PostHoraire::PostHoraire($project->getConsomation()->getallConsomationAnnuel()[0]);
                $ImportePH[0]=PostHoraire::PostHoraire($project->getImporte()[0]);
                $CedePH[0]=PostHoraire::PostHoraire($project->getCedee()[0]);

                $c=1;
                $productionPH[0]=PostHoraire::PostHoraire($prodvalue);
                $productionPH[1]=$CedePH[0];
                
            }
            else{
                $c=0;
                $productionPH[0]=PostHoraire::PostHoraire($prodvalue);
            }

            for ($j=$c;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
                $consommationPH[$j]=PostHoraire::PostHoraire($project->getConsomation()->getallConsomationAnnuel()[$j]);
                for($i=0;$i<13;$i++){
                    $autconsommePH[$j][$i]['jour']=min($productionPH[$j][$i]['jour'],$consommationPH[$j][$i]['jour']);
                    $autconsommePH[$j][$i]['ete']=min($productionPH[$j][$i]['ete'],$consommationPH[$j][$i]['ete']);
                    $autconsommePH[$j][$i]['soir']=min($productionPH[$j][$i]['soir'],$consommationPH[$j][$i]['soir']);
                    $autconsommePH[$j][$i]['nuit']=min($productionPH[$j][$i]['nuit'],$consommationPH[$j][$i]['nuit']);                  
        
                }
               
                for($i=0;$i<13;$i++){
                    $ImportePH[$j][$i]['jour']=($consommationPH[$j][$i]['jour']-$autconsommePH[$j][$i]['jour']);
                    $ImportePH[$j][$i]['ete']=($consommationPH[$j][$i]['ete']-$autconsommePH[$j][$i]['ete']);
                    $ImportePH[$j][$i]['soir']=($consommationPH[$j][$i]['soir']-$autconsommePH[$j][$i]['soir']);
                    $ImportePH[$j][$i]['nuit']=($consommationPH[$j][$i]['nuit']-$autconsommePH[$j][$i]['nuit']);                  
        
                }
                for($i=0;$i<13;$i++){
                    $CedePH[$j][$i]['jour']=($productionPH[$j][$i]['jour']-$autconsommePH[$j][$i]['jour']);
                    $CedePH[$j][$i]['ete']=($productionPH[$j][$i]['ete']-$autconsommePH[$j][$i]['ete']);
                    $CedePH[$j][$i]['soir']=($productionPH[$j][$i]['soir']-$autconsommePH[$j][$i]['soir']);
                    $CedePH[$j][$i]['nuit']=($productionPH[$j][$i]['nuit']-$autconsommePH[$j][$i]['nuit']);                  
        
                }
                $productionPH[$j+1]=$CedePH[$j];
            }    

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 

                for($i=0;$i<13;$i++){
                    $autconsommePHTot[$i]['jour']+= $autconsommePH[$j][$i]['jour'];
                    $autconsommePHTot[$i]['ete']+= $autconsommePH[$j][$i]['ete'];
                    $autconsommePHTot[$i]['soir']+= $autconsommePH[$j][$i]['soir'];
                    $autconsommePHTot[$i]['nuit']+= $autconsommePH[$j][$i]['nuit'];                  
        
                }
            }

                $auto_consomer_postHor[0]=0;
                $auto_consomer_postHor[1]=0;
                $auto_consomer_postHor[2]=0;
                $auto_consomer_postHor[3]=0;
                foreach ($autconsommePHTot as $tmp) {
                    $auto_consomer_postHor[0]+=$tmp['jour'];
                    $auto_consomer_postHor[1]+=$tmp['soir'];
                    $auto_consomer_postHor[2]+=$tmp['nuit'];
                    $auto_consomer_postHor[3]+=$tmp['ete'];
        
                }

               



                /************************************************************** */


    if($project->getConsomation()->getTypeTarif()==0){

        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){                  
            for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++) {
                $cm_annuel[$j]+= $project->getConsomation()->getallConsomationAnnuel()[$j][$i][1];
                $a_cm_annuel[$j]+= $project->getAutoConsomer()[$j][$i][1];
            }
            $factureannuel[$j]=$cm_annuel[$j]*$project->getFinance()->getTarifUni();
            $taux_auto[$j]=(float)($a_cm_annuel[$j]/$cm_annuel[$j]);
        }   
        for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++) {
            $cedee_annuel+=$project->getCedee()[count($project->getConsomation()->getallConsomationAnnuel())-1][$i][1];
        }

    }
    else{


        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){                  
            for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++) {
                $cm_annuel[$j]+= $project->getConsomation()->getallConsomationAnnuel()[$j][$i][1];
            }
        }  
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 

            for($i=0;$i<13;$i++){
                $autconsommePHTotps[$j]['jour']+= $autconsommePH[$j][$i]['jour'];
                $autconsommePHTotps[$j]['ete']+= $autconsommePH[$j][$i]['ete'];
                $autconsommePHTotps[$j]['soir']+= $autconsommePH[$j][$i]['soir'];
                $autconsommePHTotps[$j]['nuit']+= $autconsommePH[$j][$i]['nuit'];
                
                

                $ImportePHTotps[$j]['jour']+= $ImportePH[$j][$i]['jour'];
                $ImportePHTotps[$j]['ete']+= $ImportePH[$j][$i]['ete'];
                $ImportePHTotps[$j]['soir']+= $ImportePH[$j][$i]['soir'];
                $ImportePHTotps[$j]['nuit']+= $ImportePH[$j][$i]['nuit'];         
    
            }
            $a_cm_annuel[$j]=$autconsommePHTotps[$j]['jour']+$autconsommePHTotps[$j]['ete']+$autconsommePHTotps[$j]['soir']+$autconsommePHTotps[$j]['nuit'];
            $taux_auto[$j]=(float)($a_cm_annuel[$j]/$cm_annuel[$j]);
            $imp_annuel[$j]=(float)($cm_annuel[$j]-$a_cm_annuel[$j]);
            
            $PH_consomationannuel[$j]=Horaireannuel::Horaireannuel($project->getConsomation()->getallConsomationAnnuel()[$j]);
            $PH_consomationannuel[$j][0]=$PH_consomationannuel[$j]['jour'];
            $PH_consomationannuel[$j][1]=$PH_consomationannuel[$j]['soir'];
            $PH_consomationannuel[$j][2]=$PH_consomationannuel[$j]['nuit'];
            $PH_consomationannuel[$j][3]=$PH_consomationannuel[$j]['ete'];
           for ($i = 0; $i < 4; $i++) {
               $factureannuel[$j] += $PH_consomationannuel[$j][$i]*
                   $project->getFinance()->getTarifHoraire()['vende'][$i];
                   
           }
        }


        
        
                
                $cedee_postH[0]=0;
                $cedee_postH[1]=0;
                $cedee_postH[2]=0;
                $cedee_postH[3]=0;
               
                foreach ($CedePH[$lastit] as $tmp) {
                    $cedee_postH[0]+=$tmp['jour'];
                    $cedee_postH[1]+=$tmp['soir'];
                    $cedee_postH[2]+=$tmp['nuit'];
                    $cedee_postH[3]+=$tmp['ete'];
                }
                
        

        $cedee_annuel=$cedee_postH[0]+$cedee_postH[1]+$cedee_postH[2]+$cedee_postH[3];

        
           
            
            

    }   

        $f_reg=$project->getFinance()->getFRegularisation()[0];
        $month=[];
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
            for($i=0;$i<13;$i++){
                $month[$j][$i]['jour']=0;
                $month[$j][$i]['ete']=0;
                $month[$j][$i]['soir']=0;
                $month[$j][$i]['nuit']=0;
                $month[$j][$i]['total']=0;
                $month[$j][$i]['total']=0;
            }
        }   
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){  

        $month[$j]=PostHoraire::PostHoraire($project->getConsomation()->getallConsomationAnnuel()[$j]);
    
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

<?php

namespace App\Controller;

use App\Entity\Project;
use App\Service\FinanceService;
use App\Service\PostHoraire;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Dompdf\Options;
use Dompdf\Dompdf;

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
            $ps_centrale=$project->getPvgis()->getPeakPower();
            $lat=$project->getPvgis()->getLat();
            $lon=$project->getPvgis()->getLon();
            $azimut=$project->getPvgis()->getAzimuth();
            $incl = $project->getPvgis()->getSlop();
            $loss=$project->getPvgis()->getLoss();
        }

        if($project->getNinja()!=null){
            for ($i=0;$i<count($project->getNinja()->getResult());$i++) {
               $prd_annuel+= $project->getNinja()->getResult()[$i][1];
            }
            $ps_centrale=$project->getNinja()->getCapacity();
            $lat=$project->getNinja()->getLat();
            $lon=$project->getNinja()->getLon();
            $azimut=$project->getNinja()->getAzimuth();
            $incl = $project->getNinja()->getTilt();
            $loss=$project->getNinja()->getLoss();
        }
        else if($project->getCsvProd()!=null){
            for ($i=0;$i<count($project->getCsvProd()->getResult());$i++) {
                $prd_annuel+= $project->getCsvProd()->getResult()[$i][1];
            }
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
            'f_r'=>$f_reg,
            'facture_annuel'=>$factureannuel,
            'tri'=>$project->getFinance()->getTri25(),
            'co2evite'=>($prod25ans*(0.57/1000)),
            'productible'=>$productible,
            'prod25ans'=>$prod25ans,
            'azim'=>$azimut,
            'lat'=>$lat,
            'lon'=>$lon,
            'puissance_centrale'=>$ps_centrale,
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

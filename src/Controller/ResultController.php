<?php

namespace App\Controller;

use DateTimeZone;
use App\Entity\Project;
use App\Service\PostHoraire;
use App\Service\Horaireannuel;
use App\Service\FinanceService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

/**
 * @Route("/result")
 */
class ResultController extends AbstractController
{
    /**
     * @Route("/{id}/project_results", name="project_results")
     */
    public function index(Request $request , Project $project)
    {
        if($request->isXmlHttpRequest()){

            $allautoconsomme=$project->getAutoConsomer();
            $allimporte=$project->getImporte();
            
            for ($i=0;$i<count($allautoconsomme[0]);$i++){ 
                $totautoconsomme[0][$i]=0;
                $totautoconsomme[1][$i]=0;
                $totimporte[0][$i]=0;
                $totimporte[1][$i]=0;
            }

            for ($i=0;$i<count($allautoconsomme[0]);$i++){ 
                for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 

                    $totautoconsomme[1][$i]+=$allautoconsomme[$j][$i][1];
                    $totautoconsomme[0][$i]= $allautoconsomme[0][$i][0];
                    $totimporte[1][$i]+=$allimporte[$j][$i][1];
                    $totimporte[0][$i]= $allimporte[0][$i][0];
                }
            }   



            $f_transport=[];
            $prodvalue=[];
            if($project->getCsvProd()!=null){
                $prodvalue=$project->getCsvProd()->getResult();
            }
            if($project->getPvgis()!=null)
                $prodvalue=$project->getPvgis()->getResult();
            if($project->getNinja()!=null)
                $prodvalue=$project->getNinja()->getResult();



               
                $prd_annuel=0;
                $cedee_annuel=0;
                $prod25ans=0;
                if($project->getPvgis()!=null){
                    for ($i=0;$i<count($project->getPvgis()->getResult());$i++) {
                        $prd_annuel+= $project->getPvgis()->getResult()[$i][1];
                    }
                    $ps_centrale=$project->getPvgis()->getPeakPower();
                }
                else if($project->getCsvProd()!=null){
                    for ($i=0;$i<count($project->getCsvProd()->getResult());$i++) {
                        $prd_annuel+= $project->getCsvProd()->getResult()[$i][1];
                    }
                    $ps_centrale=$project->getCsvProd()->getPuissence();
                }
                else if($project->getNinja()!=null){
                    for ($i=0;$i<count($project->getNinja()->getResult());$i++) {
                        $prd_annuel+= $project->getNinja()->getResult()[$i][1];
                    }
                    $ps_centrale=$project->getNinja()->getCapacity();    
                }
    
    
    
                for ($i=0;$i<25;$i++){
                    $prod25ans+=(float)($prd_annuel-($prd_annuel*((pow($project->getFinance()->getDegradation(),$i))/100)));
                }
    
    
                $productible=$prd_annuel/$ps_centrale;
        

                
            
           
       /* for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){    
            for($i=0;$i<13;$i++){
                $monthimp[$j][$i]['jour']=0;
                $monthimp[$j][$i]['ete']=0;
                $monthimp[$j][$i]['soir']=0;
                $monthimp[$j][$i]['nuit']=0;
                $monthimp_uniform[$j][$i]=0;
                $month_auto[$j][$i]=0;

            }
        }   
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){
            foreach ($allimporte[$j] as $item) {
                $date = new \DateTime(null);
                $date->setTimestamp($item[0]);
                if (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
                    if( (int)$date->format('H')>=7&&(int)$date->format('H')<=8 ||
                        (int)$date->format('H')>13&&(int)$date->format('H')<=18){
                        $monthimp[$j][((int)$date->format('m'))]['jour']+=$item[1];
                    }
                    elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                        (int)$date->format('H')>21&&(int)$date->format('H')<=23){
                        $monthimp[$j][((int)$date->format('m'))]['nuit']+=$item[1];
                    }
                    elseif ((int)$date->format('H')>=9&&(int)$date->format('H')<=13){
                        $monthimp[$j][((int)$date->format('m'))]['ete']+=$item[1];
                    }
                    else
                        $monthimp[$j][((int)$date->format('m'))]['soir']+=$item[1];
                }
                else{
                    if( (int)$date->format('H')>=7&&(int)$date->format('H')<=17){
                        $monthimp[$j][((int)$date->format('m'))]['jour']+=$item[1];
                    }
                    elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                        (int)$date->format('H')>=21&&(int)$date->format('H')<=23){
                        $monthimp[$j][((int)$date->format('m'))]['nuit']+=$item[1];
                    }
                    else{
                        $monthimp[$j][((int)$date->format('m'))]['soir']+=$item[1];
                    }
                }

            }
        } 
        $monthimp_uniform=[];
        $month_auto=[];
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   
            for($i=0;$i<count($allautoconsomme[0]);$i++){
                $date = new \DateTime(null);
                $date->setTimestamp($allautoconsomme[$j][$i][0]);
                $monthimp_uniform[$j][((int)$date->format('m'))]+=$allimporte[$j][$i][1];
                $month_auto[$j][((int)$date->format('m'))]+=$allautoconsomme[$j][$i][1];
            }
        }
       */
         
            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){
                $cm_annuel[$j]=0;
                $a_cm_annuel[$j]=0;
                $imp_annuel[$j]=0;
                $taux_auto[$j]=0;
    
            }


            $gain_cedeetot=0;
            $gain_transptot=0;
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){                  
            for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++) {
                $cm_annuel[$j]+= $project->getConsomation()->getallConsomationAnnuel()[$j][$i][1];
                $a_cm_annuel[$j]+= $project->getAutoConsomer()[$j][$i][1];
                
            }
            $taux_auto[$j]=(float)($a_cm_annuel[$j]/$cm_annuel[$j]);
            $imp_annuel[$j]=(float)($cm_annuel[$j]-$a_cm_annuel[$j]);
        }    
        for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++) {

        $cedee_annuel+=$project->getCedee()[count($project->getConsomation()->getallConsomationAnnuel())-1][$i][1];

        }
            $f_reg=$project->getFinance()->getFRegularisation()[0];
            if(!$project->getFinance()->getTransportEng()){
                for($i=0;$i<(count($project->getFinance()->getfactransport()));$i++){
                   $f_transport[]=0;
                }
            }
            else {
                for($i=0;$i<(count($project->getFinance()->getGainTransporter()));$i++){
                    $f_transport[]=$project->getFinance()->getfactransport()[$i];
                }

            }
            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   
                $PH_consomation[$j]=[];
                $PH_auto_consomer[$j]=[];
                $PH_importer[$j]=[];
            }

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   

                $PH_consomation[$j]=PostHoraire::PostHoraire($project->getConsomation()->getallConsomationAnnuel()[$j]);
                
                $PH_auto_consomer[$j]=PostHoraire::PostHoraire($project->getAutoConsomer()[$j]);
                    
                $PH_importer[$j]=PostHoraire::PostHoraire($project->getImporte()[$j]);
            }

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   

                $PH_consomationannuel[$j]=Horaireannuel::Horaireannuel($project->getConsomation()->getallConsomationAnnuel()[$j]);
                
                $PH_auto_consomerannuel[$j]=Horaireannuel::Horaireannuel($project->getAutoConsomer()[$j]);
                    
                $PH_importerannuel[$j]=Horaireannuel::Horaireannuel($project->getImporte()[$j]);
            }

            if($project->getConsomation()->getTypeTarif()==0){
                for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
                    $g_E_transporterSite[$j] =FinanceService::gainEnergieTransporterUnif($project->getfinance()->getTarifUni(),$project,$project->getAutoConsomer()[$j]);
                }
            }

            else  {
                for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
                $g_E_transporterSite[$j] =FinanceService::gainEnergieTransporterHoraire($project->getfinance()->getTarifHoraire(),$project,$project->getAutoConsomer()[$j]);
                }
            }  


            return new JsonResponse(['consomation'=>$project->getConsomation()->getallConsomationAnnuel(),
                'peak'=>$ps_centrale,
                'productible'=>$productible,
                'coutproj'=>($project->getFinance()->getDepense()+$project->getFinance()->getCapex()-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention()),
                'lcoe'=>(($project->getFinance()->getDepense()+$project->getFinance()->getCapex())-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention())/$prod25ans,
                'f_reg'=>$f_reg,
                't_auto'=>$taux_auto,
                'auto_consommationS'=>$a_cm_annuel,
                'consommationS'=>$cm_annuel,
                'importerS'=>$imp_annuel,
                /*'t_couverture'=>(float)($prd_annuel/$cm_annuel),*/
                't_cedee'=>(float)($cedee_annuel/$prd_annuel),
                'prod25'=>$prod25ans,
                'production'=>$prodvalue,
                'auto_consomer'=>$project->getAutoConsomer(),
                'cedee'=>$project->getCedee(),
                'importer'=>$project->getImporte(),
                'PH_consomation'=>$PH_consomation,
                'PH_production'=>PostHoraire::PostHoraire($prodvalue),
                'PH_auto_consomer'=>$PH_auto_consomer,
                'PH_cedee'=>PostHoraire::PostHoraire($project->getCedee()[count($project->getConsomation()->getallConsomationAnnuel())-1]),
                'PH_importer'=>$PH_importer,
                'PH_consomationannuel'=>$PH_consomationannuel,
                'PH_auto_consomerannuel'=>$PH_auto_consomerannuel,
                'PH_importerannuel'=>$PH_importerannuel,
                /*'monthimp_unif'=>$monthimp_uniform,
                'month_auto'=>$month_auto,*/
                'dureeProj'=>$project->getFinance()->getDureeProj(),
                'cashflow'=>$project->getFinance()->getCashflow(),
                'cashflow_cum'=>$project->getFinance()->getCashflowCum(),
                'annuite'=>$project->getFinance()->getAnnuite(),
                'cfads'=>$project->getFinance()->getCfads(),
                'dsacr'=>$project->getFinance()->getDscr(),
                'gain_E_transporter'=>$project->getFinance()->getGainTransporter(),
                'g_E_transporterSite'=>$g_E_transporterSite,
                'inv'=>($project->getFinance()->getCapex()*(1-($project->getFinance()->getSubvention()/100))),
                'gain_E_cedee'=>$project->getFinance()->getGainCedee(),
                'gain_ans'=>$project->getFinance()->getGainAns(),
                'Facture_transport'=>$f_transport,
                'opex'=>FinanceService::opex($project),
                'facture_regrularisation'=>$project->getFinance()->getFRegularisation() ,
                'transpE'=>$project->getFinance()->getTransportEng(),
                'llcr'=>$project->getFinance()->getLlcr(),
                'cashFlowIn'=>$project->getFinance()->getCashflowIn(),
                'maturiter'=>$project->getFinance()->getMaturiteProj(),
                'delee'=>$project->getFinance()->getDelaiGrace(),
                'capex'=>$project->getFinance()->getCapex(),
                'subv'=>$project->getFinance()->getSubvention(),
                'taux_ac'=>$project->getFinance()->getTauxActualisation(),
                'credit'=>$project->getFinance()->getMontantDette(),
                'taux_credit'=>$project->getFinance()->getTauxInteret(),
                'tricap'=>$project->getFinance()->getTricapitaux(),
                'tri25'=>$project->getFinance()->getTri25(),
                'van'=>$project->getFinance()->getVan()

                ]);
        }
    }
    /**
     * @Route("/{id}/results", name="results")
     */
    public function result(Request $request , Project $project)
    {
        return $this->render('result/index.html.twig',[
            'project'=>$project,
        ]);
    }
}

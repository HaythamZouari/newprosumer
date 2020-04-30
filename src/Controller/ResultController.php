<?php

namespace App\Controller;

use DateTimeZone;
use App\Entity\Project;
use App\Service\PostHoraire;
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
            $f_transport=[];
            $prodvalue=[];
            if($project->getCsvProd()!=null){
                $prodvalue=$project->getCsvProd()->getResult();
            }
            if($project->getPvgis()!=null)
                $prodvalue=$project->getPvgis()->getResult();
            if($project->getNinja()!=null)
                $prodvalue=$project->getNinja()->getResult();
            $monthimp=[];
            $monthimp_uniform=[];
            $month_auto=[];
            for($i=0;$i<13;$i++){
                $monthimp[$i]['jour']=0;
                $monthimp[$i]['ete']=0;
                $monthimp[$i]['soir']=0;
                $monthimp[$i]['nuit']=0;
                $monthimp_uniform[$i]=0;
                $month_auto[$i]=0;

            }
            foreach ($project->getImporte() as $item) {
                $date = new \DateTime(null, new DateTimeZone('UTC'));
                $date->setTimestamp($item[0]);
                if (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
                    if( (int)$date->format('H')>=7&&(int)$date->format('H')<=8 ||
                        (int)$date->format('H')>13&&(int)$date->format('H')<=18){
                        $monthimp[((int)$date->format('m'))]['jour']+=$item[1];
                    }
                    elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                        (int)$date->format('H')>21&&(int)$date->format('H')<=23){
                        $monthimp[((int)$date->format('m'))]['nuit']+=$item[1];
                    }
                    elseif ((int)$date->format('H')>=9&&(int)$date->format('H')<=13){
                        $monthimp[((int)$date->format('m'))]['ete']+=$item[1];
                    }
                    else
                        $monthimp[((int)$date->format('m'))]['soir']+=$item[1];
                }
                else{
                    if( (int)$date->format('H')>=7&&(int)$date->format('H')<=17){
                        $monthimp[((int)$date->format('m'))]['jour']+=$item[1];
                    }
                    elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                        (int)$date->format('H')>=21&&(int)$date->format('H')<=23){
                        $monthimp[((int)$date->format('m'))]['nuit']+=$item[1];
                    }
                    else{
                        $monthimp[((int)$date->format('m'))]['soir']+=$item[1];
                    }
                }

            }
            for($i=0;$i<count($project->getAutoConsomer());$i++){
                $date = new \DateTime(null, new DateTimeZone('UTC'));
                $date->setTimestamp($project->getAutoConsomer()[$i][0]);
                $monthimp_uniform[((int)$date->format('m'))]+=$project->getImporte()[$i][1];
                $month_auto[((int)$date->format('m'))]+=$project->getAutoConsomer()[$i][1];
            }
            $cm_annuel=0;
            $a_cm_annuel=0;
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
            $gain_cedeetot=0;
            $gain_transptot=0;

            for ($i=0;$i<count($project->getConsomation()->getConsomationAnnuel());$i++) {
                $cm_annuel+= $project->getConsomation()->getConsomationAnnuel()[$i][1];
                $a_cm_annuel+= $project->getAutoConsomer()[$i][1];
                $cedee_annuel+=$project->getCedee()[$i][1];
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

            return new JsonResponse(['consomation'=>$project->getConsomation()->getConsomationAnnuel(),
                'peak'=>$ps_centrale,
                'productible'=>$productible,
                'coutproj'=>($project->getFinance()->getDepense()+$project->getFinance()->getCapex()-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention()),
                'lcoe'=>(($project->getFinance()->getDepense()+$project->getFinance()->getCapex())-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention())/$prod25ans,
                'f_reg'=>$f_reg,
                't_auto'=>(float)($a_cm_annuel/$cm_annuel),
                't_couverture'=>(float)($prd_annuel/$cm_annuel),
                't_cedee'=>(float)($cedee_annuel/$prd_annuel),
                'prod25'=>$prod25ans,
                'production'=>$prodvalue,
                'auto_consomer'=>$project->getAutoConsomer(),
                'cedee'=>$project->getCedee(),
                'importer'=>$project->getImporte(),
                'PH_consomation'=>PostHoraire::PostHoraire($project->getConsomation()->getConsomationAnnuel()),
                'PH_production'=>PostHoraire::PostHoraire($prodvalue),
                'PH_auto_consomer'=>PostHoraire::PostHoraire($project->getAutoConsomer()),
                'PH_cedee'=>PostHoraire::PostHoraire($project->getCedee()),
                'PH_importer'=>PostHoraire::PostHoraire($project->getImporte()),
                'monthimp'=>$monthimp,
                'monthimp_unif'=>$monthimp_uniform,
                'month_auto'=>$month_auto,
                'dureeProj'=>$project->getFinance()->getDureeProj(),
                'cashflow'=>$project->getFinance()->getCashflow(),
                'cashflow_cum'=>$project->getFinance()->getCashflowCum(),
                'annuite'=>$project->getFinance()->getAnnuite(),
                'cfads'=>$project->getFinance()->getCfads(),
                'dsacr'=>$project->getFinance()->getDscr(),
                'gain_E_transporter'=>$project->getFinance()->getGainTransporter(),
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

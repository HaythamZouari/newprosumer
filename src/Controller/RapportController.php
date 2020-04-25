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
        $incl=0;
        $cm_annuel=0;
        $a_cm_annuel=0;
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
        $month=[];

        for($i=0;$i<13;$i++){
            $month[$i]['jour']=0;
            $month[$i]['ete']=0;
            $month[$i]['soir']=0;
            $month[$i]['nuit']=0;

        }

        $month=PostHoraire::PostHoraire($project->getConsomation()->getConsomationAnnuel());
    
        if (isset($_REQUEST['download'])=='download') { 

        
        $pdfOptions = new Options();

        // Instantiate Dompdf with our options
        $dompdf = new Dompdf($pdfOptions);
            
        // Retrieve the HTML generated in our twig file
        $html = $this->renderView('rapport/index.html.twig', [
            'cmmonth'=>$month,
            'loss'=>$loss,
            'incl'=>$incl,
            'f_r'=>$f_reg,
            'facture_annuel'=>($cm_annuel*$project->getFinance()->getTarifUni()),
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
            'T_autoC'=>(float)($a_cm_annuel/$cm_annuel),
            'T_couverture'=>(float)($prd_annuel/$cm_annuel),
            'T_cedee'=>(float)($cedee_annuel/$prd_annuel),
            'typeTarif'=>$TarifSouscrit,
            'coutproj'=>($project->getFinance()->getDepense()+$project->getFinance()->getCapex()-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention()),
            'lcoe'=>(($project->getFinance()->getDepense()+$project->getFinance()->getCapex())-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention())/$prod25ans,
        ]);
        $html .='<link rel="stylesheet" href="C:/Users/zouar/documents/projets/prosumers/public/build/css/screen.css"/>';
            
        define("DOMPDF_ENABLE_JAVASCRIPT", true);    
        // Load HTML to Dompdf
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4','portrait');
        // (Optional) Setup the paper size and orientation 'portrait' or 'portrait'
        // Render the HTML as PDF
        $dompdf->render();

        // Output the generated PDF to Browser (force download)
        $dompdf->stream("Rapport d'étude.pdf", [
            "Attachment" => false
        ]);
        };
    
        return $this->render('rapport/index.html.twig', [

            'cmmonth'=>$month,
            'loss'=>$loss,
            'incl'=>$incl,
            'f_r'=>$f_reg,
            'facture_annuel'=>($cm_annuel*$project->getFinance()->getTarifUni()),
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
            'T_autoC'=>(float)($a_cm_annuel/$cm_annuel),
            'T_couverture'=>(float)($prd_annuel/$cm_annuel),
            'T_cedee'=>(float)($cedee_annuel/$prd_annuel),
            'typeTarif'=>$TarifSouscrit,
            'coutproj'=>($project->getFinance()->getDepense()+$project->getFinance()->getCapex()-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention()),
            'lcoe'=>(($project->getFinance()->getDepense()+$project->getFinance()->getCapex())-$project->getFinance()->getCredit()-$project->getFinance()->getSubvention())/$prod25ans,
        ]);

    }
}

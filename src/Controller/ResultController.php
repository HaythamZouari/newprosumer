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
                    $ps_centrale=$project->getPvgis()->getPeakPower()[0]+$project->getPvgis()->getPeakPower()[1]+$project->getPvgis()->getPeakPower()[2];
                    $incl = $project->getPvgis()->getSlop()[0];
                    $incl1 = $project->getPvgis()->getSlop()[1];
                    $incl2 = $project->getPvgis()->getSlop()[2];
                    $pschamp=$project->getPvgis()->getPeakPower()[0];
                    $pschamp1=$project->getPvgis()->getPeakPower()[1];
                    $pschamp2=$project->getPvgis()->getPeakPower()[2];
                    $azimut=$project->getPvgis()->getAzimuth()[0];
                    $azimut1=$project->getPvgis()->getAzimuth()[1];
                    $azimut2=$project->getPvgis()->getAzimuth()[2];
                }

               
                
                else if($project->getCsvProd()!=null){
                    for ($i=0;$i<count($project->getCsvProd()->getResult());$i++) {
                        $prd_annuel+= $project->getCsvProd()->getResult()[$i][1];
                    }
                    $ps_centrale=$project->getCsvProd()->getPuissence();
                    $incl1 = 0;
                    $incl2 = 0;
                    $azimut1=0;
                    $azimut2=0;
                    $pschamp=0;
                    $pschamp1=0;
                    $pschamp2=0;
                }
               
                else if($project->getNinja()!=null){
                    for ($i=0;$i<count($project->getNinja()->getResult());$i++) {
                        $prd_annuel+= $project->getNinja()->getResult()[$i][1];
                    }
                    $ps_centrale=$project->getNinja()->getCapacity(); 
                    $incl1 = 0;
                    $incl2 = 0;
                    $azimut1=0;
                    $azimut2=0;
                    $pschamp=0;
                    $pschamp1=0;
                    $pschamp2=0;   
                }

                if($project->getCsvProd()!=null){
                    $degradation=$project->getCsvProd()->getDegradation();
                }
                if($project->getPvgis()!=null)
                    $degradation=$project->getPvgis()->getDegradation();
                if($project->getNinja()!=null)
                    $degradation=$project->getNinja()->getDegradation();
    
    
    
                for ($i=0;$i<25;$i++){
                    $prod25ans+=(float)($prd_annuel-($prd_annuel*((pow( $degradation,$i))/100)));
                }
    
    
                $productible=$prd_annuel/$ps_centrale;
                


         

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
            
           
                

    if($project->getConsomation()->getTypeTarif()==0){

                 
        for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
            $g_E_transporterSite[$j] =FinanceService::gainEnergieTransporterUnif($project->getfinance()->getTarifUni(),$project,$project->getAutoConsomer()[$j]);
        }        
        
    }
    else{
        for ($k=0;$k<count($project->getConsomation()->getallConsomationAnnuel());$k++){   

           
                $auto_consomer_postHor[0]=$autconsommePHTotps[$k]['jour'];
                $auto_consomer_postHor[1]=$autconsommePHTotps[$k]['ete'];
                $auto_consomer_postHor[2]=$autconsommePHTotps[$k]['soir'];
                $auto_consomer_postHor[3]=$autconsommePHTotps[$k]['nuit'];
    
            
    
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
            
        }
       

    }
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


    $f_reg=$project->getFinance()->getFRegularisation()[0];
    
    for($i=0;$i<(count($project->getFinance()->getGainTransporter()));$i++){
        $f_transport[]=$project->getFinance()->getfactransport()[$i];
    }
    $opex=FinanceService::opex($project,$project->getFinance()->getReplinv());
    array_unshift($opex,0);




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
                'cedee'=>$Cedetot,
                'importer'=>$project->getImporte(),
                'PH_consomation'=>$PH_consomation,
                'PH_production'=>$project->getproductionPH(),
                'PH_auto_consomer'=>$PH_auto_consomer,
                'PH_cedee'=>$CedePH,
                'PH_importer'=>$PH_importer,
                'PH_consomationannuel'=>$PH_consomationannuel,
                'PH_auto_consomerannuel'=>$PH_auto_consomerannuel,
                'PH_importerannuel'=>$PH_importerannuel,
                'PH_cedeeannuel'=>$cedee_postH,
                
                'PH_productionannuel'=>$productiontotPH,
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
               
                'opex'=>$opex,
                'facture_regrularisation'=>$project->getFinance()->getFRegularisation() ,
                'transpE'=>$project->getConsomation()->getTransportEng(),
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
                'van'=>$project->getFinance()->getVan(),
                'subventionarray'=>$project->getFinance()->getSubventionarray(),
                
                
                'pschamp'=>$pschamp,
                'pschamp1'=>$pschamp1,
                'pschamp2'=>$pschamp2,
                


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

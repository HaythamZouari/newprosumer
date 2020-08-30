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
                    $ps_centrale=$project->getPvgis()->getPeakPower()[0]+$project->getPvgis()->getPeakPower()[1]+$project->getPvgis()->getPeakPower()[2];
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
                $autconsommePH[0]=PostHoraire::PostHoraire($allautoconsomme[0]);
                $consommationPH[0]=PostHoraire::PostHoraire($project->getConsomation()->getallConsomationAnnuel()[0]);
                $ImportePH[0]=PostHoraire::PostHoraire($allimporte[0]);
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

            
                for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
                    $g_E_transporterSite[$j] =FinanceService::gainEnergieTransporterUnif($project->getfinance()->getTarifUni(),$project,$project->getAutoConsomer()[$j]);
                }
            

                $cedee_postH=Horaireannuel::Horaireannuel($project->getCedee()[count($project->getConsomation()->getallConsomationAnnuel())-1]);
                $cedeLastIt=PostHoraire::PostHoraire($project->getCedee()[count($project->getConsomation()->getallConsomationAnnuel())-1]);
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

        
           
            
            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   
                $PH_consomation[$j]=[];
                $PH_auto_consomer[$j]=[];
                $PH_importer[$j]=[];
            }

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   

                $PH_consomation[$j]=$consommationPH[$j];
                
                $PH_auto_consomer[$j]=$autconsommePH[$j];
                    
                $PH_importer[$j]=$ImportePH[$j];
            }

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){   

                $PH_consomationannuel[$j]=Horaireannuel::Horaireannuel($project->getConsomation()->getallConsomationAnnuel()[$j]);
                
                $PH_auto_consomerannuel[$j]=$autconsommePHTotps[$j];
                    
                $PH_importerannuel[$j]=$ImportePHTotps[$j];
            }

        for ($k=0;$k<count($project->getConsomation()->getallConsomationAnnuel());$k++){   

           
                $auto_consomer_postHor[0]=$autconsommePHTotps[$k]['jour'];
                $auto_consomer_postHor[1]=$autconsommePHTotps[$k]['soir'];
                $auto_consomer_postHor[2]=$autconsommePHTotps[$k]['nuit'];
                $auto_consomer_postHor[3]=$autconsommePHTotps[$k]['ete'];
    
            
    
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
        $cedeLastIt=$CedePH[count($project->getConsomation()->getallConsomationAnnuel())-1];

    }

            $f_reg=$project->getFinance()->getFRegularisation()[0];
           
            for($i=0;$i<(count($project->getFinance()->getGainTransporter()));$i++){
                $f_transport[]=$project->getFinance()->getfactransport()[$i];
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
                'PH_cedee'=>$cedeLastIt,
                
                'PH_importer'=>$PH_importer,
                'PH_consomationannuel'=>$PH_consomationannuel,
                'PH_auto_consomerannuel'=>$PH_auto_consomerannuel,
                'PH_importerannuel'=>$PH_importerannuel,
                'PH_cedeeannuel'=>$cedee_postH,
                
                'PH_productionannuel'=>Horaireannuel::Horaireannuel($prodvalue),
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
                'opex'=>FinanceService::opex($project,$project->getFinance()->getReplinv()),
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

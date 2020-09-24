<?php

namespace App\Controller;

use Math_Finance;
use App\Entity\Finance;
use App\Entity\Project;
use App\Service\PostHoraire;
use App\Service\FinanceService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use PhpOffice\PhpSpreadsheet\Calculation\Financial as Finances;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class FinanceController extends AbstractController
{
    /**
     * @Route("/{id}/finance", name="finance")
     */
    public function index(Request $request,Project $project)
    {
        $dep=0;
        if ($request->isXmlHttpRequest()){
            $finance = new Finance();

            if ($request->get('credit')==null)
                $finance->setCredit(false);
            else{
                $finance->setCredit(true);
                $finance->setMontantDette((float)$request->get('dette'));
                $finance->setTauxInteret((float)$request->get('interet'));
                $finance->setDelaiGrace((float)$request->get('delai_grace'));
                $finance->setMaturiteProj((float)$request->get('maturite_proj'));
                
                
            }

            if (($project->getConsomation()->getTransportEng())==false){
                
                $t=1;
            }
            else{
               
                $t=0;
            }


            $finance->setProject($project);
            
            $finance->setCapex((float)$request->get('capex'));
            $finance->setAugTarifAchat((float)$request->get('aug_tarif_a'));
            $finance->setAugTarifVende((float)$request->get('aug_tarif_v'));
            $finance->setDureeProj((float)$request->get('duree_proj'));
            $finance->setOpex((float)$request->get('opex'));
            $finance->setSubvention((float)$request->get('subvention'));
            $finance->setTarifHoraire(['vende'=>[0=>0.115,1=>0.182,2=>0.168,3=>0.087],'achat'=>[0=>0.245,1=>0.371,2=>0.334,3=>0.193]]);
            $finance->setTarifUni(0.256);
            $finance->setTarifTransport(0.007);
            $finance->setTauxActualisation((float)$request->get('taux_actualisation'));
            $allautoconsomme=$project->getAutoConsomer();
            $replinv=((float)$request->get('replinv'));
            $finance->setReplinv((float)$request->get('replinv'));
            
            for ($i=0;$i<count($allautoconsomme[0]);$i++){ 
            $tottransporte[$i][0]=0;
            $tottransporte[$i][1]=0;
            }

            for ($i=0;$i<count($allautoconsomme[0]);$i++){ 
                for ($j=$t;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 

                    $tottransporte[$i][1]+=$allautoconsomme[$j][$i][1];
                    $tottransporte[$i][0]= $allautoconsomme[0][$i][0];
                }
              
            }   

            for ($i=0;$i<count($allautoconsomme[0]);$i++){ 
                $totautoconsomme[$i][0]=0;
                $totautoconsomme[$i][1]=0;
            }
    
            for ($i=0;$i<count($allautoconsomme[0]);$i++){ 
                for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 

                $totautoconsomme[$i][1]+=$allautoconsomme[$j][$i][1];
                $totautoconsomme[$i][0]= $allautoconsomme[0][$i][0];
                }
                
            }   


            
            if($project->getPvgis() != null)
                $production=$project->getPvgis()->getResult() ;
            if($project->getCsvProd() != null)
                    $production=$project->getCsvProd()->getResult();
            if ($project->getNinja() != null)
                    $production=$project->getNinja()->getResult();
            
                    
                    if($project->getCsvProd()!=null){
                        $degradation=$project->getCsvProd()->getDegradation();
                    }
                    if($project->getPvgis()!=null)
                        $degradation=$project->getPvgis()->getDegradation();
                    if($project->getNinja()!=null)
                        $degradation=$project->getNinja()->getDegradation();        
                
                


           

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

            for ($j=0;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
                
                for($i=1;$i<13;$i++){
                    $autconsommePHTot[$i]['jour']+= $project->getauto_consomerPH()[$j][$i]['jour'];
                    $autconsommePHTot[$i]['ete']+= $project->getauto_consomerPH()[$j][$i]['ete'];
                    $autconsommePHTot[$i]['soir']+= $project->getauto_consomerPH()[$j][$i]['soir'];
                    $autconsommePHTot[$i]['nuit']+= $project->getauto_consomerPH()[$j][$i]['nuit'];                  
        
                }
            }

            if (count($project->getConsomation()->getallConsomationAnnuel())>1){

                for ($j=1;$j<count($project->getConsomation()->getallConsomationAnnuel());$j++){ 
                    
                    for($i=1;$i<13;$i++){
                        $CedePH[$i]['jour']+= $project->getcedeePH()[$j][$i]['jour'];
                        $CedePH[$i]['ete']+= $project->getcedeePH()[$j][$i]['ete'];
                        $CedePH[$i]['soir']+= $project->getcedeePH()[$j][$i]['soir'];
                        $CedePH[$i]['nuit']+= $project->getcedeePH()[$j][$i]['nuit'];                  
            
                    }
                }
            }
            else{
                $CedePH=$project->getinjectPH();
            }


            



           

            if($project->getConsomation()->getTypeTarif()==0){
                    $g_E_transporter =FinanceService::gainEnergieTransporterUnif($finance->getTarifUni(),$project,$totautoconsomme);
                    $g_E_cedee=FinanceService::gainEnergieCedee($finance->getTarifHoraire(),$project);
                    $f_transporter=FinanceService::facteurTransport($project,$tottransporte);
                    $f_regularisation=FinanceService::factureRegularisation($g_E_cedee,$project,$CedePH);
               
            }

            else  {
                
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
                for($j=0;$j<30;$j++){
                    $result[$j]=0;
                    for ($i= 0 ;$i<4;$i++){
                        $result[$j]+= ($auto_consomer_postHor[$i]*
                            pow((1-($degradation/100)),$i)*
                            $finance->getTarifHoraire()['achat'][$i]*
                            pow((1+($project->getFinance()->getAugTarifAchat()/100)),$j));
                    }
                }

                $g_E_transporter=$result;            
                
                $lastit=count($project->getConsomation()->getallConsomationAnnuel())-1;
                
                $cedee_postH[0]=0;
                $cedee_postH[1]=0;
                $cedee_postH[2]=0;
                $cedee_postH[3]=0;
                $result=[];
                foreach ($CedePH as $tmp) {
                    $cedee_postH[0]+=$tmp['jour'];
                    $cedee_postH[1]+=$tmp['ete'];
                    $cedee_postH[2]+=$tmp['soir'];
                    $cedee_postH[3]+=$tmp['nuit'];
                }
                for($j=0;$j<30;$j++) {
                    $g_E_cedee[$j]=0;
                    for ($i = 0; $i < 4; $i++) {
                        $g_E_cedee[$j] += ($cedee_postH[$i] *
                            pow((1 -($degradation/100)), $j) *
                            $finance->getTarifHoraire()['vende'][$i] *
                            pow((1 + ($project->getFinance()->getAugTarifVende()/100)), $j));
                    }
                }

                $total_auto_consome=$auto_consomer_postHor[0]+$auto_consomer_postHor[1]+$auto_consomer_postHor[2]+$auto_consomer_postHor[3];
                for ($i=0;$i<30;$i++){
                    $f_transporter[$i] = ($total_auto_consome*pow((1-($degradation/100)),$i)*
                        $project->getFinance()->getTarifTransport());
                }

                
                    $cedee_total=0;
                    $prod_total=0;
                    $cedee_total=$cedee_postH[0]+$cedee_postH[1]+$cedee_postH[2]+$cedee_postH[3];
                    
                    for($i=0;$i<count($production);$i++){
                        
                        $prod_total+=$production[$i][1];
                    }
                    $taux_cedee=$cedee_total/$prod_total;
                    $result=[];
                    for($i=0;$i<30;$i++){
                        if($cedee_total>0){
                            $f_regularisation[$i]=0;
                            $f_regularisation[$i]=(($g_E_cedee[$i]/$cedee_total)*
                                (($taux_cedee-0.3)*
                                    $prod_total)
                            );

                        }
                        else
                        $f_regularisation[$i]=0;
                        if($f_regularisation[$i]<0)
                        $f_regularisation[$i]=0;

                    }

            }

          

            

            
            $gain=[];
            $cash_flow=[];
            $cash_flow_cumule=[];
            $CFADS=[];
            $dscr=[];
            $annuite=[];
            $f_transporter=[];
            $subvention=[];
           
            $frais_exp=FinanceService::fraisExploitation($project);
            $opex=FinanceService::opex($project,$replinv);
            
            $f_transporter=FinanceService::facteurTransport($project,$tottransporte);
            array_unshift($g_E_cedee,0);
            array_unshift($g_E_transporter,0);
            array_unshift($frais_exp,0);
            array_unshift($opex,0);
            array_unshift($f_transporter,0);
            array_unshift($f_regularisation,0);
            

            for ($i=0;$i<30;$i++) {
            $subvention[$i]=0;
            $annuite[$i]=0;
            }
            $subvention[(float)$request->get('ansubvention')]=$finance->getCapex()*($finance->getSubvention()/100);

            for ($i=0;$i<30;$i++) {
                $gain[]=$g_E_cedee[$i]+$g_E_transporter[$i];
            }
            
            if ($finance->getCredit()===true){
                $annuite= FinanceService::Anuite($finance->getMaturiteProj(),$finance->getDelaiGrace(),$project);
                
                $delee=$finance->getDelaiGrace();
                $maturite=$finance->getMaturiteProj();

                for ($i=0;$i<30;$i++)
                    $CFADS[$i]= ($gain[$i]-$opex[$i]- $f_transporter[$i] - $f_regularisation[$i]);
               /* for ($i=$delee+$maturite;$i<30;$i++)
                    $CFADS[$i]=0;*/
            }

            for($i=0;$i<30;$i++){
                $depense[$i]=$opex[$i]+$f_regularisation[$i]+$f_transporter[$i]+$annuite[$i];
            }
           
            for($i=0;$i<($request->get('duree_proj'));$i++){
                $dep+=$depense[$i];
            }
            for($i=0;$i<30;$i++) {
                $cash_flow[]=$gain[$i] - $depense[$i];
            }
            for($i=0;$i<30;$i++){
                $dscr[$i]=0;
            }
            for($i=1;$i<=$finance->getMaturiteProj()+$finance->getDelaiGrace();$i++){
                $dscr[$i]=(float)($CFADS[$i]/$annuite[$i]);
            }
           
            $consommation=$project->getConsomation()->getallConsomationAnnuel();
            if($project->getCsvProd()!=null){
                $production=$project->getCsvProd()->getResult();
            }
            if($project->getPvgis()!=null)
                $production=$project->getPvgis()->getResult();
            if($project->getNinja()!=null)
                $production=$project->getNinja()->getResult();
           
            
            $auto=$project->getAutoConsomer();
            $cedee=$project->getCedee();
            $importee=$project->getImporte();
            for ($i=0;$i<30;$i++) {
                $cash_flow[$i]=$cash_flow[$i]+$subvention[$i];
                
                }
            $cash_flow[0]=$cash_flow[0]+FinanceService::cashflowInt($project);
            $cash_flow_cumule[0]=$cash_flow[0];
            for($i=1;$i<count($cash_flow);$i++){
                $cash_flow_cumule[$i]=$cash_flow_cumule[$i-1]+$cash_flow[$i];
            }

            

            for ($i=0;$i<=($request->get('duree_proj'));$i++) {
                $cash_flowres[$i]=$cash_flow[$i];
                $CFADSres[$i]=$CFADS[$i]+$subvention[$i];
    
                
                
            }

            $finance->setAnnuite($annuite);
            $finance->setSubventionarray($subvention);
            $finance->setfactransport($f_transporter);
            $finance->setDepense($dep);
            $finance->setGainCedee($g_E_cedee);
            $finance->setGainTransporter($g_E_transporter);
            $finance->setFRegularisation($f_regularisation);
            $finance->setCashflow($cash_flow);
            $finance->setCashflowCum($cash_flow_cumule);
            $finance->setDscr($dscr);
            $finance->setCfads($CFADS);
            $finance->setCashflowIn(FinanceService::cashflowInt($project));
            $finance->setGainAns($gain);
            $finance->setLlcr(FinanceService::LLCR($project,$annuite,$CFADS));
            array_unshift($CFADS, (-1*($finance->getCapex())));
            array_unshift($CFADSres, (-1*($finance->getCapex())));
            
            $finance->setTri25(((float)Finances::IRR($CFADSres,0.2))*100);
            $finance->setTricapitaux((float)Finances::IRR($cash_flowres,0.3)*100);
            array_unshift($cash_flowres,$finance->getTauxActualisation()/100);
            $finance->setVan(Finances::NPV($cash_flowres));
            $this->getDoctrine()->getManager()->persist($finance);
            $this->getDoctrine()->getManager()->flush();
                //for($i=0;$i<$)
                return new JsonResponse([
                    'con'=>$consommation,
                    'pro'=>$production,
                    'aut'=>$auto,
                    'ced'=>$cedee,
                    'imp'=>$importee,
                    'arr'=>$CFADS,
                    'tot'=>$totautoconsomme,
                    'all'=>$allautoconsomme,
                    'dep'=>$dep,
                    'depense'=>$depense,
                    'gain'=>$gain,
                    'cash_flow'=>$cash_flow,
                   'autoconsoPH'=>$autconsommePHTot
                    ]);
        }
    }
}

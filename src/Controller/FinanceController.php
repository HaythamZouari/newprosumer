<?php

namespace App\Controller;

use App\Entity\Finance;
use App\Entity\Project;
use App\Service\FinanceService;
use Math_Finance;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use PhpOffice\PhpSpreadsheet\Calculation\Financial as Finances;

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

            if (($request->get('transport_energie'))==null){
                $finance->setTransportEng(false);
            }
            else{
                $finance->setTransportEng(true);
            }
            $finance->setProject($project);
            $finance->setDegradation((float)$request->get('degradation'));
            $finance->setCapex((float)$request->get('capex'));
            $finance->setAugTarifAchat((float)$request->get('aug_tarif_a'));
            $finance->setAugTarifVende((float)$request->get('aug_tarif_v'));
            $finance->setDureeProj((float)$request->get('duree_proj'));
            $finance->setOpex((float)$request->get('opex'));
            $finance->setSubvention((float)$request->get('subvention'));
            $finance->setTarifHoraire(['vende'=>[0=>0.115,1=>0.168,2=>0.087,3=>0.182],'achat'=>[0=>0.245,1=>0.334,2=>0.193,3=>0.371]]);
            $finance->setTarifUni(0.256);
            $finance->setTarifTransport(0.007);
            $finance->setTauxActualisation((float)$request->get('taux_actualisation'));
            if($request->get('transport_energie') ==0){
                $g_E_transporter =FinanceService::gainEnergieTransporterUnif($finance->getTarifUni(),$project);
            }

            else  {
                $g_E_transporter =FinanceService::gainEnergieTransporterHoraire($finance->getTarifHoraire(),$project);
            }  
            $g_E_cedee=FinanceService::gainEnergieCedee($finance->getTarifHoraire(),$project);
            $gain=[];
            $cash_flow=[];
            $cash_flow_cumule=[];
            $CFADS=[];
            $dscr=[];
            $annuite=[];
            $f_transporter=[];
            $f_regularisation=FinanceService::factureRegularisation($g_E_cedee,$project);
            $frais_exp=FinanceService::fraisExploitation($project);
            $opex=FinanceService::opex($project);
            if ($finance->getTransportEng() ==true){
                $f_transporter=FinanceService::facteurTransport($project);
            }
            else{
                for($i=0;$i<30;$i++){
                    $f_transporter[$i]=0;
                }
            }

            for ($i=0;$i<30;$i++) {
                $gain[]=$g_E_cedee[$i]+$g_E_transporter[$i];
            }
            if ($finance->getCredit()===true){
                $annuite= FinanceService::Anuite($finance->getMaturiteProj(),$finance->getDelaiGrace(),$project);
                
                $delee=$finance->getDelaiGrace();
                $maturite=$finance->getMaturiteProj();

                for ($i=0;$i<$delee+$maturite;$i++)
                    $CFADS[$i]= ($gain[$i]-$opex[$i]- $f_transporter[$i] - $f_regularisation[$i]);
               /* for ($i=$delee+$maturite;$i<30;$i++)
                    $CFADS[$i]=0;*/
            }
            else{
                for ($i=0;$i<30;$i++){
                    $CFADS[$i]=0;
                }
            }
            $depense =FinanceService::depenses($opex,$annuite,$f_regularisation,$f_transporter,$finance->getMaturiteProj(),$finance->getDelaiGrace());
            for($i=0;$i<count($depense);$i++){
                $dep+=$depense[$i];
            }
            for($i=0;$i<30;$i++) {
                $cash_flow[]=$gain[$i] - $depense[$i];
            }
            for($i=0;$i<$finance->getMaturiteProj()+$finance->getDelaiGrace();$i++){
                $dscr[$i]=(float)($CFADS[$i]/$annuite[$i]);
            }
            $cash_flow_cumule[0]=$cash_flow[0]+FinanceService::cashflowInt($project);
            for($i=1;$i<count($cash_flow);$i++){
                $cash_flow_cumule[$i]=$cash_flow_cumule[$i-1]+$cash_flow[$i];
            }
            
            $finance->setAnnuite($annuite);
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
            array_unshift($CFADS, (-1*($finance->getCapex()*(1- ($finance->getSubvention()/100)))));
            array_unshift($cash_flow,FinanceService::cashflowInt($project));
            $finance->setTri25(((float)Finances::IRR($CFADS,0.1))*100);
            $finance->setTricapitaux((float)Finances::IRR($cash_flow,0.3)*100);
            array_unshift($cash_flow,$finance->getTauxActualisation()/100);
            $finance->setVan(Finances::NPV($cash_flow));
            $this->getDoctrine()->getManager()->persist($finance);
            $this->getDoctrine()->getManager()->flush();
                //for($i=0;$i<$)
                return new JsonResponse([

                    'arr'=>$CFADS
                    ]);
        }
    }
}

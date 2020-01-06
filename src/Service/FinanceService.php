<?php


namespace App\Service;


use App\Entity\Project;

//0=>jour|1=>soir|2=>nuit|3=>ete
class FinanceService
{
    public static function gainEnergieTransporterUnif(float $tarif, Project $project){
        $total_auto_consome=0;
        $result=[];
        foreach ($project->getAutoConsomer() as $autoconsomer) {
            $total_auto_consome+=$autoconsomer[1];
        }
        for ($i=0;$i<30;$i++){
            $result[$i] = ($total_auto_consome*
                pow((1-(float)($project->getFinance()->getDegradation()/100)),$i)*
                $tarif*
                pow((1+(float)($project->getFinance()->getAugTarifAchat()/100)),$i));
        }
        return $result;

    }
    public static function gainEnergieTransporterHoraire(array $tarif ,Project $project){
        $auto_consomer_postHor_temp=PostHoraire::PostHoraire($project->getAutoConsomer());
        $result=[];
        $auto_consomer_postHor[0]=0;
        $auto_consomer_postHor[1]=0;
        $auto_consomer_postHor[2]=0;
        $auto_consomer_postHor[3]=0;
        foreach ($auto_consomer_postHor_temp as $tmp) {
            $auto_consomer_postHor[0]+=$tmp['jour'];
            $auto_consomer_postHor[1]+=$tmp['soir'];
            $auto_consomer_postHor[2]+=$tmp['nuit'];
            $auto_consomer_postHor[3]+=$tmp['ete'];

        }
        for($j=0;$j<30;$j++){
            $result[$j]=0;
            for ($i= 0 ;$i<4;$i++){
                $result[$j]+= ($auto_consomer_postHor[$i]*
                    pow((1-($project->getFinance()->getDegradation()/100)),$i)*
                    $tarif['achat'][$i]*
                    pow((1+($project->getFinance()->getAugTarifAchat()/100)),$i));
            }
        }
        return $result;

    }
    public static function gainEnergieCedee(array $tarif,Project $project){
        $cedee_postH_tmp=PostHoraire::PostHoraire($project->getCedee());
        $cedee_postH[0]=0;
        $cedee_postH[1]=0;
        $cedee_postH[2]=0;
        $cedee_postH[3]=0;
        $result=[];
        foreach ($cedee_postH_tmp as $tmp) {
            $cedee_postH[0]+=$tmp['jour'];
            $cedee_postH[1]+=$tmp['soir'];
            $cedee_postH[2]+=$tmp['nuit'];
            $cedee_postH[3]+=$tmp['ete'];
        }
        for($j=0;$j<30;$j++) {
            $result[$j]=0;
            for ($i = 0; $i < 4; $i++) {
                $result[$j] += ($cedee_postH[$i] *
                    pow((1 -( $project->getFinance()->getDegradation()/100)), $j) *
                    $tarif['vende'][$i] *
                    pow((1 + ($project->getFinance()->getAugTarifVende()/100)), $j));
            }
        }
        return $result;
    }
    //Opex
    public static function fraisExploitation(Project $project){
        $result=[];
        for($i=0;$i<30;$i++){
            $result[$i]=0;
           $result[$i]+= ($project->getFinance()->getCapex()*
               ($project->getFinance()->getOpex()/100)*
               pow((1+($project->getFinance()->getTauxActualisation()/100)),$i));
        }
        return $result;
    }
    public static function Anuite(Project $project){
        return ((($project->getFinance()->getTauxInteret()/100)*
            $project->getFinance()->getMontantDette())/
            (1-pow((1+($project->getFinance()->getTauxInteret()/100)),-$project->getFinance()->getMaturiteProj()))
        );
    }
    //if
    public static function factureRegularisation(array $gain_cedee,Project $project){
        $cedee=$project->getCedee();
        if ($project->getPvgis()!=null)
            $prod=$project->getPvgis()->getResult();
        if($project->getCsvProd()!=null)
            $prod=$project->getCsvProd()->getResult();

        $cedee_total=0;
        $prod_total=0;
        $cedee=$project->getCedee();
        for($i=0;$i<count($cedee);$i++){
            $cedee_total+=$cedee[$i][1];
            $prod_total+=$prod[$i][1];
        }
        $taux_cedee=$cedee_total/$prod_total;
        $result=[];
        for($i=0;$i<30;$i++){
            if($cedee_total>0){
                $result[$i]=0;
                $result[$i]=(($gain_cedee[$i]/$cedee_total)*
                    (($taux_cedee-0.3)*
                        $prod_total)
                );

            }
            else
                $result[$i]=0;
            if($result[$i]<0)
                $result[$i]=0;

        }
        return $result;
    }
    public static function facteurTransport(Project $project){
        $total_auto_consome=0;
        $result=[];
        foreach ($project->getAutoConsomer() as $autoconsomer) {
            $total_auto_consome+=$autoconsomer[1];
        }
        for ($i=0;$i<30;$i++){
            $result[$i] = ($total_auto_consome*pow((1-($project->getFinance()->getDegradation()/100)),$i)*
                $project->getFinance()->getTarifTransport()
            );
        }
        return $result;


    }
    public static function depenses(array $frais_exp,float $annuite,array $f_reg,array $f_transport,int $maturite,int $delee){
        $result=[];
        for($i=0;$i<$delee;$i++){
            $result[$i]=$frais_exp[$i]+$f_reg[$i]+$f_transport[$i];
        }
        for($i=$delee;$i<($delee+$maturite);$i++){
            $result[$i]=$frais_exp[$i]+$annuite+$f_reg[$i]+$f_transport[$i];
        }
        for($i=($maturite+$delee);$i<(count($f_transport));$i++){
            $result[$i]=$frais_exp[$i]+$f_reg[$i]+$f_transport[$i];
        }
        return $result;
    }
    public static function depenses2(array $frais_exp,float $annuite,array $f_reg){
        $result=[];
        for($i=0;$i<count($frais_exp);$i++){
            $result[$i]=$frais_exp[$i]+$annuite+$f_reg[$i];
        }
        return $result;
    }
    public static function opex(Project $project){
        $result=[];
        for($i=0;$i<30;$i++){
            $result[]= ($project->getFinance()->getCapex()*
                (float)($project->getFinance()->getOpex()/100)*
                pow((1+(float)($project->getFinance()->getTauxActualisation()*0.01)),$i));
        }
        return $result;
    }
    public static function LLCR(Project $project, float $annuite,array $cfads){
        $result=[];

        for($i=0;$i<$project->getFinance()->getMaturiteProj();$i++){
            $tmp_result=0;
            for($j=$i;$j<$project->getFinance()->getMaturiteProj();$j++){
                $tmp_result += $cfads[$j]/pow((1+($project->getFinance()->getTauxActualisation()/100)),$j);

            }
            $result[]=($tmp_result/(
                $project->getFinance()->getMontantDette() - ($i*$annuite)
                ))
            ;
        }
        return $result;

    }
    public static function cashflowInt(Project $project){
       return -(float)(($project->getFinance()->getCapex()) *
           (1 - (float)($project->getFinance()->getSubvention()/100)) - $project->getFinance()->getMontantDette()
       );
    }

}
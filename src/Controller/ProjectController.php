<?php

namespace App\Controller;

use DateTimeZone;
use App\Entity\Project;
use Carbon\CarbonPeriod;
use App\Form\ProjectType;
use App\Entity\Consomation;
use App\Service\FileUpload;
use App\Service\ExcelReader;
use App\Service\PostHoraire;
use App\Repository\ProjectRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

/**
 * @Route("/project")
 */
class ProjectController extends AbstractController
{
    private $avgweek=[];
    public function __construct()
    {
        for( $i =0 ; $i<7;$i++){
            for($j = 0 ; $j<=23;$j++){
                $avgweek[0][$i][$j]=0;
                $avgweek[1][$i][$j]=0;
            }
        }
    }

    /**
     * @Route("/", name="project_index", methods={"GET"})
     */
    public function index(ProjectRepository $projectRepository): Response
    {
        return $this->render('project/index.html.twig', [
            'projects' => $projectRepository->findBy(['user'=>$this->getUser()]),
        ]);
    }

    /**
     * @Route("/new", name="project_new", methods={"GET","POST"})
     */
    public function new(Request $request): Response {
        $project = new Project();
        $form = $this->createForm(ProjectType::class, $project);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager = $this->getDoctrine()->getManager();
            $project->setUser($this->getUser());
            $entityManager->persist($project);
            $entityManager->flush();
            return $this->redirectToRoute('project_show',['id'=>$project->getId()]);
        }

        return $this->render('project/new.html.twig', [
            'project' => $project,
            'form' => $form->createView(),
        ]);
    }



    /**
     * @Route("/excelupload/{id}",name="excelupload")
     */
    public function excelupload(Project $project,Request $request,FileUpload $fileUpload,Session $session){
        // get the file from the request object
        $file = $request->files->get('file');
        $filePath =$fileUpload->upload($file,'consomation');
        $data=ExcelReader::createDataFromSpreadsheet('uploads/'.$filePath);
        $date = new \DateTime(null, new DateTimeZone('UTC'));
        $dateDebexl=$data[0][0];
        $dateFinexl=$data[count($data)-1][0];
        $session->set('dateDebExl',$dateDebexl);
        $session->set('dateFinExl',$dateFinexl);
        $factor[2][7]=[24];
        $tarifUni[2][7]=[24];
        $tariftmp=[];
        for( $i =0 ; $i<7;$i++){
            for($j = 0 ; $j<=23;$j++){
                $factor[0][$i][$j]=0;
                $factor[1][$i][$j]=0;
                $tarifUni[0][$i][$j]=0;
                $tarifUni[1][$i][$j]=0;
            }
        }
        foreach ($data as $datum) {
           $date->setTimestamp($datum[0]);
           //if the month is between 6,7,8 it's avrg summr week
           if(((int)$date->format('m'))>5 && ((int)$date->format('m'))<9){
               for ($i =0 ; $i<7;$i++){
                   if((int)$date->format('w')==$i){
                       for($j =0;$j<=23;$j++){
                           if((int)$date->format('H')==$j){
                               $tarifUni[0][$i][$j]+=(int)$datum[1];
                               $factor[0][$i][$j]++;
                           }
                       }
                   }
               }
           }
           else{
               for ($i =0 ; $i<7;$i++){
                   if($date->format('w')==$i){
                       for($j =0;$j<=23;$j++){
                           if((int)$date->format('H')==$j){
                                $tarifUni[1][$i][$j]+=(int)$datum[1];
                                $factor[1][$i][$j]++;
                           }
                       }
                   }
               }
           }
        }
        $tariftmp=$tarifUni;
        for ($i =0 ; $i<7;$i++) {
            for ($j = 0; $j <= 23; $j++) {
                if($factor[0][$i][$j]===0){
                    $factor[0][$i][$j]=$factor[1][$i][$j];
                }
                if($tarifUni[0][$i][$j]===0){
                    $tarifUni[0][$i][$j]=$tarifUni[1][$i][$j];
                }
                if($factor[1][$i][$j]===0){
                    $factor[1][$i][$j]=$factor[0][$i][$j];
                }
                if($tarifUni[1][$i][$j]===0){
                    $tarifUni[1][$i][$j]=$tarifUni[0][$i][$j];
                }
            }
        }

        for ($i =0 ; $i<7;$i++){
            for($j =0;$j<=23;$j++){
                $tarifUni[0][$i][$j]/=$factor[0][$i][$j];
                $tarifUni[1][$i][$j]/=$factor[1][$i][$j];
            }
        }
       /* for ($i =0 ; $i<7;$i++) {
            array_push($tarifUni[0][$i], $tarifUni[0][$i][0]);
            array_push($tarifUni[0][$i], $tarifUni[0][$i][1]);
            array_splice($tarifUni[0][$i], 0, 2);


        }*/


        $project->getConsomation()->setAvgweek($tarifUni);
        $project->getConsomation()->setUrlCcv($filePath);
        $entityManager=$this->getDoctrine()->getManager();
        $entityManager->persist($project);
        $entityManager->flush();
        $session->set('avgweek',$tarifUni);
        $session->set('data',$data);
        return new JsonResponse(['data'=>$project->getConsomation()->getAvgweek(),
        'factor'=>$factor,
        'somme'=>$tariftmp,
        'info'=>$data,
        'tt'=>$dateDebexl
        ]);

    }

    /**
     * @Route("/{id}", name="project_show", methods={"GET","POST"})
     * @throws \Exception
     */
    public function show(Project $project,Request $request,Session $session)
    {
        date_default_timezone_set("Africa/Tunis");
    if ($request->isXmlHttpRequest()){
        
            $consomation =$project->getConsomation();
            $dateDeb= new \DateTime($request->get('dateDeb'));
            $dateDebexel= new \DateTime();
            $dateDebexel->setTimestamp($session->get('dateDebExl'));
            $dateFinexel= new \DateTime();
            $dateFinexel->setTimestamp($session->get('dateFinExl'));
            $dateFin= new \DateTime($request->get('dateDeb'));
            $dateFin->add(new \DateInterval('P1Y'));
            $avgweek=$project->getConsomation()->getAvgweek();
            $dataexl = $session->get('data');
            $activite=$request->get('activite');
            $dimancheCheck=$request->get('dimancheCheck');
            $hourSlider_dimanche=$request->get('hourSlider_dimanche');
            $hourSlider_samedi=$request->get('hourSlider_samedi');
            $hourSlider1=$request->get('hourSlider1');
            $hourSlider2=$request->get('hourSlider2');
            $hourSlider3=$request->get('hourSlider3');
            $monthSlider1=$request->get('monthSlider1');
            $monthSlider2=$request->get('monthSlider2');
            $monthSlider3=$request->get('monthSlider3');
            $saison=$request->get('saison');
            $samediCheck=$request->get('samediCheck');
            $dateconge_deb= new \DateTime($request->get('dateconge_deb'));
            $dateconge_fin= new \DateTime($request->get('dateconge_fin'));
            
            
        if (empty($avgweek[0][0][0])){
            
            $hourSliderreq1=explode(',',$hourSlider1);
            $hourSliderreq2=explode(',',$hourSlider2);
            $hourSliderreq3=explode(',',$hourSlider3);
            $hourSliderreqS=explode(',',$hourSlider_samedi);
            $hourSliderreqD=explode(',',$hourSlider_dimanche);
            $monthSliderreq1=explode(',',$monthSlider1);
            $monthSliderreq2=explode(',',$monthSlider2);
            $monthSliderreq3=explode(',',$monthSlider3);

            if ($saison==1) {
                $hourSliderreq2=[24,24];
                $hourSliderreq3=[24,24];
                $monthSliderreq2=[24,24];
                $monthSliderreq3=[24,24];
            }
            elseif($saison==2){
                $hourSliderreq3=[24,24];
                $monthSliderreq3=[24,24];

            }

            if ($activite=='Abattoir'){
                $Phd=119;$Phf=120;$Phm=494;$Phad=360;$Pham=372;$Phn=63;
                 }
            elseif ($activite=='Agroalimentaire'){
                $Phd=134;$Phf=104;$Phm=175;$Phad=209;$Pham=195;$Phn=50;
                }
             elseif ($activite=='Bureautique'){
                $Phd=404;$Phf=418;$Phm=590;$Phad=618;$Pham=632;$Phn=394;
                }
            elseif ($activite=='Extraction'){
                $Phd=394;$Phf=336;$Phm=496;$Phad=269;$Pham=457;$Phn=19;
                    }
             elseif ($activite=='Datacenter'){
                $Phd=496;$Phf=493;$Phm=520;$Phad=510;$Pham=510;$Phn=490;
                }
             elseif ($activite=='Electromecanique'){
                $Phd=1486;$Phf=1519;$Phm=1876;$Phad=1832;$Pham=1703;$Phn=1150;
                }
             elseif ($activite=='Frigorifique'){
                $Phd=122;$Phf=160;$Phm=200;$Phad=140;$Pham=180;$Phn=160;
                }
             elseif ($activite=='Hotellerie'){
                $Phd=247;$Phf=294;$Phm=308;$Phad=346;$Pham=326;$Phn=187;
                }
             elseif ($activite=='Hypermarche'){
                $Phd=677;$Phf=676;$Phm=826;$Phad=848;$Pham=827;$Phn=416;
                }
             elseif ($activite=='Laitiere'){
                $Phd=800;$Phf=900;$Phm=1200;$Phad=1270;$Pham=1100;$Phn=820;
                }
             elseif ($activite=='Meuble'){
                $Phd=118;$Phf=80;$Phm=170;$Phad=180;$Pham=90;$Phn=42;
                }
             elseif ($activite=='Plastique'){
                $Phd=123;$Phf=122;$Phm=264;$Phad=262;$Pham=274;$Phn=115;
                }
             elseif ($activite=='Poulailler'){
                $Phd=175;$Phf=178;$Phm=173;$Phad=165;$Pham=166;$Phn=32;
                }
             elseif ($activite=='Textile'){
                $Phd=129;$Phf=122;$Phm=87;$Phad=120;$Pham=130;$Phn=25;
                }
            elseif ($activite=='Pharmaceutique'){
            $Phd=47;$Phf=68;$Phm=120;$Phad=78;$Pham=92;$Phn=36;
                }      

            $hd1=(int)$hourSliderreq1[0];$hf1=(int)$hourSliderreq1[1];$hm1=round(($hd1+$hf1)/2);$had1=round(($hd1+$hm1)/2);$ham1=round(($hf1+$hm1)/2);
            $hd2=(int)$hourSliderreq2[0];$hf2=(int)$hourSliderreq2[1];$hm2=round(($hd2+$hf2)/2);$had2=round(($hd2+$hm2)/2);$ham2=round(($hf2+$hm2)/2);
            $hd3=(int)$hourSliderreq3[0];$hf3=(int)$hourSliderreq3[1];$hm3=round(($hd3+$hf3)/2);$had3=round(($hd3+$hm3)/2);$ham3=round(($hf3+$hm3)/2);
            $hdS=(int)$hourSliderreqS[0];$hfS=(int)$hourSliderreqS[1];$hmS=round(($hdS+$hfS)/2);$hadS=round(($hdS+$hmS)/2);$hamS=round(($hfS+$hmS)/2);
            $hdD=(int)$hourSliderreqD[0];$hfD=(int)$hourSliderreqD[1];$hmD=round(($hdD+$hfD)/2);$hadD=round(($hdD+$hmD)/2);$hamD=round(($hfD+$hmD)/2);        
                $synWeek1[7]=[24];
                $synWeek2[7]=[24];
                $synWeek3[7]=[24];

                for($i =1 ; $i<6;$i++){
                    for($j = 0 ; $j<=23;$j++){
                        if (($j>=$hd1) && ($j<=$hf1)){
                            
                                if ($j==$hd1){
                                    $synWeek1[$i][$j]=$Phd;
                                }  
                                elseif ($j==$hf1){
                                    $synWeek1[$i][$j]=$Phf;
                                }
                                elseif ($j==$hm1){
                                    $synWeek1[$i][$j]=$Phm;
                                }
                                elseif ($j==$had1){
                                    $synWeek1[$i][$j]=$Phad;
                                }
                                elseif ($j==$ham1){
                                    $synWeek1[$i][$j]=$Pham;
                                }       
                                else {
                                    $synWeek1[$i][$j]=rand($Phad, $Phm);
                                } 
                            }
                           
                        else {
                            $synWeek1[$i][$j]=$Phn;
                        }
                        
                    }
                }
                                
                if ($samediCheck=='on'){
                                
                                        for($j = 0 ; $j<=23;$j++){
                                            if ($j>=$hdS && $j<=$hfS){
                                                if ($j==$hdS) {
                                                $synWeek1[6][$j]=$Phd;
                                                }
                                                if ($j==$hfS) {
                                                    $synWeek1[6][$j]=$Phf;
                                                    }
                                                if ($j==$hmS) {
                                                    $synWeek1[6][$j]=$Phm;
                                                    }    
                                                if ($j==$hadS) {
                                                    $synWeek1[6][$j]=$Phad;
                                                    } 
                                                if ($j==$hamS) {
                                                    $synWeek1[6][$j]=$Pham;
                                                    } 
                                                else {
                                                    $synWeek1[6][$j]=mt_rand($Phad, $Phm);
                                                }
                                            }    
                                            else {
                                                $synWeek1[6][$j]=$Phn;
                                            }
                                            
                                        }
                }
                else {
                                        for($j = 0 ; $j<=23;$j++){
                    
                                            $synWeek1[6][$j]=$Phn; 
                                        }
                }    
                                                
                if ($dimancheCheck=='on'){
                                
                                    for($j = 0 ; $j<=23;$j++){
                                        if ($j>=$hdD && $j<=$hfD){
                                            if ($j==$hdD) {
                                            $synWeek1[0][$j]=$Phd;
                                            }
                                            if ($j==$hfD) {
                                                $synWeek1[0][$j]=$Phf;
                                                }
                                            if ($j==$hmD) {
                                                $synWeek1[0][$j]=$Phm;
                                                }    
                                            if ($j==$hadD) {
                                                $synWeek1[0][$j]=$Phad;
                                                } 
                                            if ($j==$hamD) {
                                                $synWeek1[0][$j]=$Pham;
                                                } 
                                            else {
                                                $synWeek1[0][$j]=mt_rand($Phad, $Phm);
                                            }
                                                    
                                        }
                                            
                                        else {
                                            $synWeek1[0][$j]=$Phn;
                                        }
                                        
                                    }
                                }
                else {
                                
                    for($j = 0 ; $j<=23;$j++){
                    
                                        $synWeek1[0][$j]=$Phn; 
                                    }
                }
                for($i =1 ; $i<6;$i++){
                    for($j = 0 ; $j<=23;$j++){
                         if (($j>=$hd2) && ($j<=$hf2)){
                            if ($j==$hd2){
                                $synWeek2[$i][$j]=$Phd;
                                }  
                            elseif ($j==$hf2){
                                $synWeek2[$i][$j]=$Phf;
                                }
                            elseif ($j==$hm2){
                                $synWeek2[$i][$j]=$Phm;
                                }
                            elseif ($j==$had2){
                                $synWeek2[$i][$j]=$Phad;
                                }
                            elseif ($j==$ham2){
                                $synWeek2[$i][$j]=$Pham;
                                }       
                            else {
                                $synWeek2[$i][$j]=rand($Phad, $Phm);
                                } 
                            }
                                           
                        else {
                            $synWeek2[$i][$j]=$Phn;
                        }
                                        
                    }
                }
                                
                if ($samediCheck=='on'){
                                
                                    for($j = 0 ; $j<=23;$j++){
                                        if ($j>=$hdS && $j<=$hfS){
                                            if ($j==$hdS) {
                                            $synWeek2[6][$j]=$Phd;
                                            }
                                            if ($j==$hfS) {
                                                $synWeek2[6][$j]=$Phf;
                                                }
                                            if ($j==$hmS) {
                                                $synWeek2[6][$j]=$Phm;
                                                }    
                                            if ($j==$hadS) {
                                                $synWeek2[6][$j]=$Phad;
                                                } 
                                            if ($j==$hamS) {
                                                $synWeek2[6][$j]=$Pham;
                                                } 
                                            else {
                                                $synWeek2[6][$j]=mt_rand($Phad, $Phm);
                                            }
                                        }    
                                        else {
                                            $synWeek2[6][$j]=$Phn;
                                        }
                                        
                                    }
                }
                else {
                                    for($j = 0 ; $j<=23;$j++){
                
                                        $synWeek2[6][$j]=$Phn; 
                                    }
                }    
                                                         
                if ($dimancheCheck=='on'){
                            
                                for($j = 0 ; $j<=23;$j++){
                                    if ($j>=$hdD && $j<=$hfD){
                                        if ($j==$hdD) {
                                        $synWeek2[0][$j]=$Phd;
                                        }
                                        if ($j==$hfD) {
                                            $synWeek2[0][$j]=$Phf;
                                            }
                                        if ($j==$hmD) {
                                            $synWeek2[0][$j]=$Phm;
                                            }    
                                        if ($j==$hadD) {
                                            $synWeek2[0][$j]=$Phad;
                                            } 
                                        if ($j==$hamD) {
                                            $synWeek2[0][$j]=$Pham;
                                            } 
                                        else {
                                            $synWeek2[0][$j]=mt_rand($Phad, $Phm);
                                        }
                                                
                                    }
                                        
                                    else {
                                        $synWeek2[0][$j]=$Phn;
                                    }
                                    
                                }
                }
                else {
                                for($j = 0 ; $j<=23;$j++){
                
                                    $synWeek2[0][$j]=$Phn; 
                                }
                } 

                for($i =1 ; $i<6;$i++){
                    for($j = 0 ; $j<=23;$j++){
                        if (($j>=$hd3) && ($j<=$hf3)){
                            
                                if ($j==$hd3){
                                    $synWeek3[$i][$j]=$Phd;
                                }  
                                elseif ($j==$hf3){
                                    $synWeek3[$i][$j]=$Phf;
                                }
                                elseif ($j==$hm3){
                                    $synWeek3[$i][$j]=$Phm;
                                }
                                elseif ($j==$had3){
                                    $synWeek3[$i][$j]=$Phad;
                                }
                                elseif ($j==$ham3){
                                    $synWeek3[$i][$j]=$Pham;
                                }       
                                else {
                                    $synWeek3[$i][$j]=rand($Phad, $Phm);
                                } 
                            }
                           
                        else {
                            $synWeek3[$i][$j]=$Phn;
                        }
                        
                    }
                }
                
                if ($samediCheck=='on'){
                                
                    for($j = 0 ; $j<=23;$j++){
                        if ($j>=$hdS && $j<=$hfS){
                            if ($j==$hdS) {
                            $synWeek3[6][$j]=$Phd;
                            }
                            if ($j==$hfS) {
                                $synWeek3[6][$j]=$Phf;
                                }
                            if ($j==$hmS) {
                                $synWeek3[6][$j]=$Phm;
                                }    
                            if ($j==$hadS) {
                                $synWeek3[6][$j]=$Phad;
                                } 
                            if ($j==$hamS) {
                                $synWeek3[6][$j]=$Pham;
                                } 
                            else {
                                $synWeek3[6][$j]=mt_rand($Phad, $Phm);
                            }
                        }    
                        else {
                            $synWeek3[6][$j]=$Phn;
                        }
                        
                    }
                }
                else {
                    for($j = 0 ; $j<=23;$j++){
                
                        $synWeek3[6][$j]=$Phn; 
                    }
                }    
                
                if ($dimancheCheck=='on'){
                
                    for($j = 0 ; $j<=23;$j++){
                        if ($j>=$hdD && $j<=$hfD){
                            if ($j==$hdD) {
                            $synWeek3[0][$j]=$Phd;
                            }
                            if ($j==$hfD) {
                                $synWeek3[0][$j]=$Phf;
                                }
                            if ($j==$hmD) {
                                $synWeek3[0][$j]=$Phm;
                                }    
                            if ($j==$hadD) {
                                $synWeek3[0][$j]=$Phad;
                                } 
                            if ($j==$hamD) {
                                $synWeek3[0][$j]=$Pham;
                                } 
                            else {
                                $synWeek3[0][$j]=mt_rand($Phad, $Pham);
                            }
                                    
                        }
                            
                        else {
                            $synWeek3[0][$j]=$Phn;
                        }
                        
                    }
                }
                else {
                    for($j = 0 ; $j<=23;$j++){
                
                        $synWeek3[0][$j]=$Phn; 
                    }
                } 

                    $dataSynW=[];
                    $period = CarbonPeriod::create($dateDeb->format('y-m-d'),'PT1H',$dateFin->format('y-m-d') , CarbonPeriod::EXCLUDE_START_DATE);
                    foreach ($period as $key=>$date) {
                        if(((int)$date->format('m') )>= $monthSliderreq1[0] && ((int)$date->format('m'))<= $monthSliderreq1[1]) {
                            $dataSynW[] = [$date->getTimestamp(),$synWeek1[((int)$date->format('w'))][((int)$date->format('H'))]];
                        }
                        elseif(((int)$date->format('m') )>= $monthSliderreq2[0] && ((int)$date->format('m'))<= $monthSliderreq2[1]){
                            $dataSynW[] = [$date->getTimestamp(),$synWeek2[((int)$date->format('w'))][((int)$date->format('H'))]];
                        }
                        else{
                            $dataSynW[] = [$date->getTimestamp(),$synWeek3[((int)$date->format('w'))][((int)$date->format('H'))]];
                        }
                    }

                    for ($i=0;$i<count($dataSynW);$i++) {
                        $date = new \DateTime();
                        $date->setTimestamp($dataSynW[$i][0]);
                        
                        if((((int)$date->format('m'))>=((int)$dateconge_deb->format('m')))&&(((int)$date->format('m'))<=((int)$dateconge_fin->format('m')))){
                            if ((((int)$date->format('d')))>=(((int)$dateconge_deb->format('d')))&&(((int)$date->format('d'))<=((int)$dateconge_fin->format('d')))){
                                $dataSynW[$i][1]=$Phn;
                            }
                        }
                        else{
                        
                            if(((int)$date->format('d'))==1&&((int)$date->format('m'))==1){
                                $dataSynW[$i][1]=$Phn;
                            }
                            elseif(((int)$date->format('d'))==14&&((int)$date->format('m'))==1){
                                $dataSynW[$i][1]=$Phn;
                            }
                            elseif(((int)$date->format('d'))==20&&((int)$date->format('m'))==3){
                                $dataSynW[$i][1]=$Phn;
                            }
                            elseif(((int)$date->format('d'))==9&&((int)$date->format('m'))==4){
                                $dataSynW[$i][1]=$Phn;
                            }
                            elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==5){
                                $dataSynW[$i][1]=$Phn;
                            }
                            elseif(((int)$date->format('d'))==25&&((int)$date->format('m'))==7){
                                $dataSynW[$i][1]=$Phn;
                            }
                            elseif(((int)$date->format('d'))==13&&((int)$date->format('m'))==8){
                                $dataSynW[$i][1]=$Phn;
                            }
                            elseif(((int)$date->format('d'))==15&&((int)$date->format('m'))==10){
                                $dataSynW[$i][1]=$Phn;
                            }
                        }    
                    }
                    if($request->get('tarif')==0){
                    $monthp = $request->get('date');
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]=0;

                    }
                    foreach ($dataSynW as $item) {
                        $date = new \DateTime();
                        $date->setTimestamp($item[0]);
                        $month[((int)$date->format('m'))]+=$item[1];
                    }
                    $monthtmp=$month;
                    for($i =1 ; $i <13; $i++){
                        if ($monthtmp[$i]==0) {
                            $month[$i]=0;
                        }
                        else{
                        $month[$i]=(float)$monthp[$i]/$month[$i];
                        }
                    }

                    $dataSynWtm=$dataSynW;
                    for ($i=0;$i<count($dataSynW);$i++) {
                        $date = new \DateTime();
                        $date->setTimestamp($dataSynW[$i][0]);
                        $months=(int)$date->format('m');
                        $day=(int)$date->format('d');
                        $dataSynW[$i][1]*=$month[(int)((new \DateTime())->setTimestamp($dataSynW[$i][0])->format('m'))];
                    }
                    $month=[];
                        for($i=0;$i<13;$i++){
                            $month[$i]['jour']=0;
                            $month[$i]['ete']=0;
                            $month[$i]['soir']=0;
                            $month[$i]['nuit']=0;

                        }
                    $consomation->setCmMonth(PostHoraire::PostHoraire($dataSynW));
                        $dataAvgW=$dataSynW;
                        $dataAvgWtm=$dataSynWtm;
                    }
                        else {
                            $dataSynWtm=$dataSynW;
                            $monthp = $request->get('datehoraire');
                            //$month is an array that contain the sum of the hours of every type in every month
                            $month=[];
                            for($i=0;$i<13;$i++){
                                $month[$i]['jour']=0;
                                $month[$i]['nuit']=0;
                                $month[$i]['soir']=0;
                                $month[$i]['ete']=0;
                            }
                            $month = PostHoraire::PostHoraire($dataSynW);
                            $monthtmp = $month;
                            $consomation->setCmMonth($month);
                            for($i =1 ;$i < 13 ; $i++){
                                if($i>5&&$i<9){
                                    $month[$i]['jour']=$monthp['jour'][$i]/$month[$i]['jour'];
                                    $month[$i]['nuit']=$monthp['nuit'][$i]/$month[$i]['nuit'];
                                    $month[$i]['soir']=$monthp['soir'][$i]/$month[$i]['soir'];
                                    $month[$i]['ete']=$monthp['ete'][$i]/$month[$i]['ete'];
                                }
                                else{
                                    $month[$i]['jour']=$monthp['jour'][$i]/$month[$i]['jour'];
                                    $month[$i]['nuit']=$monthp['nuit'][$i]/$month[$i]['nuit'];
                                    $month[$i]['soir']=$monthp['soir'][$i]/$month[$i]['soir'];
                                }
                            }
                            for($i=0;$i<count($dataSynW);$i++) {
                                $date = new \DateTime(null, new DateTimeZone('UTC'));
                                $date->setTimestamp($dataSynW[$i][0]);
                                if (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
                                    if( (int)$date->format('H')>6&&(int)$date->format('H')<9 ||
                                        (int)$date->format('H')>13&&(int)$date->format('H')<19){
                                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['jour'];
                                    }
                                    elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                                        (int)$date->format('H')>21&&(int)$date->format('H')<=23){
                                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                                    }
                                    elseif ((int)$date->format('H')>=9&&(int)$date->format('H')<14){
                                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['ete'];
                                    }
                                    else
                                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['soir'];
                                }
                                else{
                                    if( (int)$date->format('H')>6&&(int)$date->format('H')<18){
                                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['jour'];
                                    }
                                    elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                                        (int)$date->format('H')>=21&&(int)$date->format('H')<=23){
                                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                                    }
                                    else {
                                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['soir'];
                                    }
                                }
                            }

                            $dataAvgW=$dataSynW;
                            $dataAvgWtm=$dataSynWtm;
                           
                        }
            

                    //******************************************************* 

                
        }
            else {     
                       
                $dataAvgW=[];
                $i =0;
            
                
                if(((int)$dateDeb->format('m') )>5 && ((int)$dateDeb->format('m'))<9) {
                    $dataAvgW[] = [$dateDeb->getTimestamp(),$avgweek[0][((int)$dateDeb->format('w'))][((int)$dateDeb->format('H'))]];
                }
                else
                    $dataAvgW[] = [$dateDeb->getTimestamp(),$avgweek[1][((int)$dateDeb->format('w'))][((int)$dateDeb->format('H'))]];
                $period = CarbonPeriod::create($dateDeb->format('y-m-d'),'PT1H',$dateFin->format('y-m-d') , CarbonPeriod::EXCLUDE_START_DATE);
                //creating a period to loop on it
                foreach ($period as $key=>$date) {
                    if((int)$date->format('U') >=(int)$dateDebexel->format('U')&&
                        (int)$date->format('U') <=(int)$dateFinexel->format('U')){
                        $dataAvgW[] = [$date->getTimestamp(), $dataexl[$i][1]];
                        $i++;

                    }
                    else{
                        if(((int)$date->format('m') )>5 && ((int)$date->format('m'))<9) {
                            $dataAvgW[] = [$date->getTimestamp(),$avgweek[0][((int)$date->format('w'))][((int)$date->format('H'))]];
                        }
                        else{
                            $dataAvgW[] = [$date->getTimestamp(),$avgweek[1][((int)$date->format('w'))][((int)$date->format('H'))]];
                        }

                    }
                }
                $dataAvgWtm=$dataAvgW;
                array_pop($dataAvgW);

                for ($i=0;$i<count($dataAvgW);$i++) {
                    $date = new \DateTime(null, new DateTimeZone('UTC'));
                    $date->setTimestamp($dataAvgW[$i][0]);
                    if(((int)$date->format('d'))==1&&((int)$date->format('m'))==1){
                        $dataAvgW[$i][1]=$avgweek[1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==14&&((int)$date->format('m'))==1){
                        $dataAvgW[$i][1]=$avgweek[1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==20&&((int)$date->format('m'))==3){
                        $dataAvgW[$i][1]=$avgweek[1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==9&&((int)$date->format('m'))==4){
                        $dataAvgW[$i][1]=$avgweek[1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==5){
                        $dataAvgW[$i][1]=$avgweek[1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==25&&((int)$date->format('m'))==7){
                        $dataAvgW[$i][1]=$avgweek[0][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==13&&((int)$date->format('m'))==8){
                        $dataAvgW[$i][1]=$avgweek[0][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==15&&((int)$date->format('m'))==10){
                        $dataAvgW[$i][1]=$avgweek[1][0][((int)$date->format('H'))];
                    }
                }
                //delete a hole year
               /* $dataAvgW[count($dataAvgW)-1][0]=$dataAvgW[count($dataAvgW)-1][0]-31536000;*/
                if($request->get('tarif')==0){
                    $monthp = $request->get('date');
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]=0;
                    }
                    foreach ($dataAvgW as $item) {
                        $date = new \DateTime(null, new DateTimeZone('UTC'));
                        $date->setTimestamp($item[0]);
                        $month[((int)$date->format('m'))]+=$item[1];
                    }
                    $monthtmp=$month;
                    for($i =1 ; $i <13; $i++){
                        if ($monthtmp[$i]==0) {
                            $month[$i]=0;
                        }
                        else{
                            $month[$i]=(float)$monthp[$i]/$month[$i];
                        }
                    }
                    $dataAvgWtm=$dataAvgW;
                    for ($i=0;$i<count($dataAvgW);$i++) {
                        $date = new \DateTime(null, new DateTimeZone('UTC'));
                        $date->setTimestamp($dataAvgW[$i][0]);
                        $months=(int)$date->format('m');
                        $day=(int)$date->format('d');
                        $dataAvgW[$i][1]*=$month[(int)((new \DateTime(null, new DateTimeZone('UTC')))->setTimestamp($dataAvgW[$i][0])->format('m'))];
                    }
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]['jour']=0;
                        $month[$i]['ete']=0;
                        $month[$i]['soir']=0;
                        $month[$i]['nuit']=0;

                    }
                    $consomation->setCmMonth(PostHoraire::PostHoraire($dataAvgW));


                }
                //*********************************************************************************************************
                //*********************************************************************************************************
                //*********************************************************************************************************
                //*********************************************************************************************************
                //*********************************************************************************************************
                else {
                    $monthp = $request->get('datehoraire');
                    //$month is an array that contain the sum of the hours of every type in every month
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]['jour']=0;
                        $month[$i]['nuit']=0;
                        $month[$i]['soir']=0;
                        $month[$i]['ete']=0;
                    }
                    $dataAvgWtm=$dataAvgW;
                    $month = PostHoraire::PostHoraire($dataAvgW);
                    $monthtmp = $month;
                    $consomation->setCmMonth($month);
                    for($i =1 ;$i < 13 ; $i++){
                        if($i>5&&$i<9){
                            $month[$i]['jour']=$monthp['jour'][$i]/$month[$i]['jour'];
                            $month[$i]['nuit']=$monthp['nuit'][$i]/$month[$i]['nuit'];
                            $month[$i]['soir']=$monthp['soir'][$i]/$month[$i]['soir'];
                            $month[$i]['ete']=$monthp['ete'][$i]/$month[$i]['ete'];
                        }
                        else{
                            $month[$i]['jour']=$monthp['jour'][$i]/$month[$i]['jour'];
                            $month[$i]['nuit']=$monthp['nuit'][$i]/$month[$i]['nuit'];
                            $month[$i]['soir']=$monthp['soir'][$i]/$month[$i]['soir'];
                        }
                    }
                    for($i=0;$i<count($dataAvgW);$i++) {
                        $date = new \DateTime(null, new DateTimeZone('UTC'));
                        $date->setTimestamp($dataAvgW[$i][0]);
                        if (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
                            if( (int)$date->format('H')>6&&(int)$date->format('H')<9 ||
                                (int)$date->format('H')>13&&(int)$date->format('H')<19){
                                $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['jour'];
                            }
                            elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                                (int)$date->format('H')>21&&(int)$date->format('H')<=23){
                                $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                            }
                            elseif ((int)$date->format('H')>=9&&(int)$date->format('H')<14){
                                $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['ete'];
                            }
                            else
                                $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['soir'];
                        }
                        else{
                            if( (int)$date->format('H')>6&&(int)$date->format('H')<18){
                                $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['jour'];
                            }
                            elseif ((int)$date->format('H')>=0&&(int)$date->format('H')<=6 ||
                                (int)$date->format('H')>=21&&(int)$date->format('H')<=23){
                                $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                            }
                            else {
                                $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['soir'];
                            }
                        }
                    }
                }

           
       
        }
            $consomation->setDateDeb($dateDeb);
            $consomation->setDateFin($dateFin);
            $consomation->setConsomationAnnuel($dataAvgW);
            $consomation->setTypeTarif($request->get('tarif'));
            $consomation->setProject($project);
            $project->setConsomation($consomation);
            $entityManager=$this->getDoctrine()->getManager();
            $entityManager->persist($consomation);
            $entityManager->persist($project);
            $entityManager->flush();
            return new JsonResponse(['virgdata'=>$dataAvgW,'data'=>$dataAvgWtm,'data2'=>$monthtmp,'period'=>$period]);
    }
        return $this->render('project/show.html.twig', [
            'project' => $project,
        ]);
    }

    /**
     * @Route("/{id}/edit", name="project_edit", methods={"GET","POST"})
     */
    public function edit(Request $request, Project $project): Response
    {
        $form = $this->createForm(ProjectType::class, $project);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->getDoctrine()->getManager()->flush();

            return $this->redirectToRoute('project_index');
        }

        return $this->render('project/edit.html.twig', [
            'project' => $project,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}", name="project_delete", methods={"DELETE"})
     */
    public function delete(Request $request, Project $project): Response
    {
        if ($this->isCsrfTokenValid('delete'.$project->getId(), $request->request->get('_token'))) {
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->remove($project);
            $entityManager->flush();
        }

        return $this->redirectToRoute('project_index');
    }
}

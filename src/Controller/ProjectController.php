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
        for( $k =0 ; $k<20;$k++){
            for( $i =0 ; $i<7;$i++){
                for($j = 0 ; $j<=23;$j++){
                    $avgweek[$k][0][$i][$j]=0;
                    $avgweek[$k][1][$i][$j]=0;
                }
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
        $data=[];
        $file = $request->files->get('file');
        $filePath =$fileUpload->upload($file,'consomation');
        $data=ExcelReader::createDataFromSpreadsheet('uploads/'.$filePath);
        $date = new \DateTime(null );
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
        $allAvgweek=$project->getConsomation()->getAvgweek();
        $allUrlCcv=$project->getConsomation()->getallUrlCcv();
        $allUrlCcv[$request->get('number')]=$filePath;
        $allAvgweek[$request->get('number')]=$tarifUni;
        $project->getConsomation()->setAvgweek($allAvgweek);
        $project->getConsomation()->setUrlCcv($filePath);
        $project->getConsomation()->setallUrlCcv($allUrlCcv);
        $entityManager=$this->getDoctrine()->getManager();
        $entityManager->persist($project);
        $entityManager->flush();
        /*$session->set('avgweek',$tarifUni);*/
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
        
    if ($request->isXmlHttpRequest()){
        
        
            $consomation =$project->getConsomation();
            $allDateDeb =$project->getConsomation()->getallDateDeb();
            $allDateFin =$project->getConsomation()->getallDateFin();
            $allDataAvgW =$project->getConsomation()->getallConsomationAnnuel();
            $allTarif =$project->getConsomation()->getTabTarif();
            $allcm_month =$project->getConsomation()->getallCmMonth();

            

            $allActivite=$project->getConsomation()->getActivite();
            $allDateconge_deb=$project->getConsomation()->getDatecongeDeb();
            $allDateconge_deb1=$project->getConsomation()->getDatecongeDeb1();
            $allDateconge_deb2=$project->getConsomation()->getDatecongeDeb2();
            $allDateconge_fin=$project->getConsomation()->getDatecongeFin();
            $allDateconge_fin1=$project->getConsomation()->getDatecongeFin1();
            $allDateconge_fin2=$project->getConsomation()->getDatecongeFin2();
            $allHourSlider1=$project->getConsomation()->getHourSlider1();
            $allHourSlider2=$project->getConsomation()->getHourSlider2();
            $allHourSlider3=$project->getConsomation()->getHourSlider3();
            $allHourSlider_dimanche=$project->getConsomation()->getHourSliderDimanche();
            $allHourSlider_samedi=$project->getConsomation()->getHourSliderSamedi();
            $allMonthSlider1=$project->getConsomation()->getMonthSlider1();
            $allMonthSlider2=$project->getConsomation()->getMonthSlider2();
            $allMonthSlider3=$project->getConsomation()->getMonthSlider3();
            $allSaison=$project->getConsomation()->getSaison();
            $allCongeCheck=$project->getConsomation()->getCongeCheck();
            $allDimancheCheck=$project->getConsomation()->getDimancheCheck();
            $allSamediCheck=$project->getConsomation()->getSamediCheck();
            $allVershoraire=$project->getConsomation()->getVershoraire();
            $allFerieCheck=$project->getConsomation()->getFerieCheck();
            

            $dateDeb= new \DateTime($request->get('dateDeb'));
            $dateDebForm= $request->get('dateDeb');
            $dateDebexel= new \DateTime(null );
            $dateDebexel->setTimestamp($session->get('dateDebExl'));
            $dateFinexel= new \DateTime(null );
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
            $dateconge_deb1= new \DateTime($request->get('dateconge_deb1'));
            $dateconge_fin1= new \DateTime($request->get('dateconge_fin1'));
            $dateconge_deb2= new \DateTime($request->get('dateconge_deb2'));
            $dateconge_fin2= new \DateTime($request->get('dateconge_fin2'));
            $number= $request->get('number');
            $allUrlCcv=$project->getConsomation()->getallUrlCcv();
            $FerieCheck=$request->get('ferieCheck');

            if (empty($allUrlCcv[$number])){

                $allUrlCcv[$number]="";

            }

            $project->getConsomation()->setallUrlCcv($allUrlCcv);

            if (empty($allDataAvgW[$number])){

                $allDataAvgW[$number]=[];
            }

            

            $allActivite[$number]=$request->get('activite');
            $allDateconge_deb[$number]=$request->get('dateconge_deb');
            $allDateconge_deb1[$number]=$request->get('dateconge_deb1');
            $allDateconge_deb2[$number]=$request->get('dateconge_deb2');
            $allDateconge_fin[$number]=$request->get('dateconge_fin');
            $allDateconge_fin1[$number]=$request->get('dateconge_fin1');
            $allDateconge_fin2[$number]=$request->get('dateconge_fin2');
            $allHourSlider1[$number]=$request->get('hourSlider1');
            $allHourSlider2[$number]=$request->get('hourSlider2');
            $allHourSlider3[$number]=$request->get('hourSlider3');
            $allHourSlider_dimanche[$number]=$request->get('hourSlider_dimanche');
            $allHourSlider_samedi[$number]=$request->get('hourSlider_samedi');
            $allMonthSlider1[$number]=$request->get('monthSlider1');
            $allMonthSlider2[$number]=$request->get('monthSlider2');
            $allMonthSlider3[$number]=$request->get('monthSlider3');
            $allSaison[$number]=$request->get('saison');
            $allCongeCheck[$number]=$request->get('congeCheck');
            $allDimancheCheck[$number]=$request->get('dimancheCheck');
            $allSamediCheck[$number]=$request->get('samediCheck');
            $allVershoraire[$number]=$request->get('vershoraire');
            $allFerieCheck[$number]=$request->get('ferieCheck');


            $project->getConsomation()->setActivite($allActivite);
            $project->getConsomation()->setDatecongeDeb($allDateconge_deb);
            $project->getConsomation()->setDatecongeDeb1($allDateconge_deb1);
            $project->getConsomation()->setDatecongeDeb2($allDateconge_deb2);
            $project->getConsomation()->setDatecongeFin($allDateconge_fin);
            $project->getConsomation()->setDatecongeFin1($allDateconge_fin1);
            $project->getConsomation()->setDatecongeFin2($allDateconge_fin2);
            $project->getConsomation()->setHourSlider1($allHourSlider1);
            $project->getConsomation()->setHourSlider2($allHourSlider2);
            $project->getConsomation()->setHourSlider3($allHourSlider3);
            $project->getConsomation()->setHourSliderDimanche($allHourSlider_dimanche);
            $project->getConsomation()->setHourSliderSamedi($allHourSlider_samedi);
            $project->getConsomation()->setMonthSlider1($allMonthSlider1);
            $project->getConsomation()->setMonthSlider2($allMonthSlider2);
            $project->getConsomation()->setMonthSlider3($allMonthSlider3);
            $project->getConsomation()->setSaison($allSaison);
            $project->getConsomation()->setCongeCheck($allCongeCheck);
            $project->getConsomation()->setDimancheCheck($allDimancheCheck);
            $project->getConsomation()->setSamediCheck($allSamediCheck);
            $project->getConsomation()->setVershoraire($allVershoraire);
            $project->getConsomation()->setFerieCheck($allFerieCheck);
            
        if (empty($avgweek[$number][0][0][0])){
            
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
                $Phd=140;$Phf=160;$Phm=200;$Phad=140;$Pham=180;$Phn=130;
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
                                                    $synWeek1[6][$j]=mt_rand(min($Phad, $Phm),max($Phad, $Phm));
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
                                                $synWeek1[0][$j]=mt_rand(min($Phad, $Phm),max($Phad, $Phm));
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
                                                $synWeek2[6][$j]=mt_rand(min($Phad, $Phm),max($Phad, $Phm));
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
                                            $synWeek2[0][$j]=mt_rand(min($Phad, $Phm),max($Phad, $Phm));
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
                                $synWeek3[6][$j]=mt_rand(min($Phad, $Phm),max($Phad, $Phm));
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
                                $synWeek3[0][$j]=mt_rand(min($Phad, $Pham),max($Phad, $Pham));
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
                        $date = new \DateTime(null );
                        $date->setTimestamp($dataSynW[$i][0]);
                        
                        if((((int)$date->format('U'))>=((int)$dateconge_deb->format('U')))&&(((int)$date->format('U'))<=((int)$dateconge_fin->format('U')))){
                            {
                                $dataSynW[$i][1]=$Phn;
                            }
                        }
                        if((((int)$date->format('U'))>=((int)$dateconge_deb1->format('U')))&&(((int)$date->format('U'))<=((int)$dateconge_fin1->format('U')))){
                            {
                                $dataSynW[$i][1]=$Phn;
                            }
                        }
                        if((((int)$date->format('U'))>=((int)$dateconge_deb2->format('U')))&&(((int)$date->format('U'))<=((int)$dateconge_fin2->format('U')))){
                            {
                                $dataSynW[$i][1]=$Phn;
                            }
                        }
                        else{

                            if ($FerieCheck!='on'){
                        
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
                        
                        
                        if(((int)$date->format('d'))==29&&((int)$date->format('m'))==2){
                            unset($dataSynW[$i]);
                        }
                    }

                    $dataSynW = array_values($dataSynW);
                    
                    if($request->get('tarif')==0){
                        $monthp = $request->get('date');
                        $month=[];
                        for($i=0;$i<13;$i++){
                            $month[$i]=0;

                        }
                        foreach ($dataSynW as $item) {
                            $date = new \DateTime(null );
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
                            $date = new \DateTime(null );
                            $date->setTimestamp($dataSynW[$i][0]);
                            $months=(int)$date->format('m');
                            $day=(int)$date->format('d');
                            $dataSynW[$i][1]*=$month[(int)((new \DateTime(null ))->setTimestamp($dataSynW[$i][0])->format('m'))];
                        }
                        $month=[];
                            for($i=0;$i<13;$i++){
                                $month[$i]['jour']=0;
                                $month[$i]['ete']=0;
                                $month[$i]['soir']=0;
                                $month[$i]['nuit']=0;

                            }
                        $consomation->setCmMonth(PostHoraire::PostHoraire($dataSynW));
                        $allcm_month[$number]=$request->get('date');
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
                        $allcm_month[$number]=$request->get('datehoraire');

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
                            $date = new \DateTime(null );
                            $date->setTimestamp($dataSynW[$i][0]);

                        if(((int)$date->format('w'))==0)
                        $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==1){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==14&&((int)$date->format('m'))==1){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==20&&((int)$date->format('m'))==3){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==9&&((int)$date->format('m'))==4){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==5){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }    
                        elseif(((int)$date->format('d'))==25&&((int)$date->format('m'))==7){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==13&&((int)$date->format('m'))==8){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==15&&((int)$date->format('m'))==10){
                            $dataSynW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }



                            elseif (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
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
                $j =0;

                $period = CarbonPeriod::create($dateDeb->format('y-m-d'),'PT1H',$dateFin->format('y-m-d'), CarbonPeriod::EXCLUDE_START_DATE);
                //creating a period to loop on it
                foreach ($period as $key=>$date) {
                   
                   if($date->getTimestamp()>=$dataexl[$i][0]-1000&&$date->getTimestamp()<=$dataexl[$i][0]+1000&&$i<(count($dataexl)-1)){
                        $dataAvgW[] = [$date->getTimestamp(), $dataexl[$i][1]];
                        $i++;
                        

                    }
                    else{
                        if(((int)$date->format('m') )>5 && ((int)$date->format('m'))<9) {
                            $dataAvgW[] = [$date->getTimestamp(),$avgweek[$number][0][((int)$date->format('w'))][((int)$date->format('H'))]];
                        }
                        else{
                            $dataAvgW[] = [$date->getTimestamp(),$avgweek[$number][1][((int)$date->format('w'))][((int)$date->format('H'))]];
                        }

                    }
                }
                $dataAvgWtm=$dataAvgW;
               

                for ($i=0;$i<count($dataAvgW);$i++) {
                    $date = new \DateTime(null );
                    $date->setTimestamp($dataAvgW[$i][0]);
                    if(((int)$date->format('d'))==1&&((int)$date->format('m'))==1){
                        $dataAvgW[$i][1]=$avgweek[$number][1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==14&&((int)$date->format('m'))==1){
                        $dataAvgW[$i][1]=$avgweek[$number][1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==20&&((int)$date->format('m'))==3){
                        $dataAvgW[$i][1]=$avgweek[$number][1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==9&&((int)$date->format('m'))==4){
                        $dataAvgW[$i][1]=$avgweek[$number][1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==5){
                        $dataAvgW[$i][1]=$avgweek[$number][1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==25&&((int)$date->format('m'))==7){
                        $dataAvgW[$i][1]=$avgweek[$number][0][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==13&&((int)$date->format('m'))==8){
                        $dataAvgW[$i][1]=$avgweek[$number][0][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==15&&((int)$date->format('m'))==10){
                        $dataAvgW[$i][1]=$avgweek[$number][1][0][((int)$date->format('H'))];
                    }
                    elseif(((int)$date->format('d'))==29&&((int)$date->format('m'))==2){
                        unset($dataAvgW[$i]);  
                    }
                    
                }
                $dataAvgW = array_values($dataAvgW);

                if($request->get('tarif')==0){
                    $monthp = $request->get('date');
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]=0;
                    }
                    foreach ($dataAvgW as $item) {
                        $date = new \DateTime(null );
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
                        $date = new \DateTime(null );
                        $date->setTimestamp($dataAvgW[$i][0]);
                        $months=(int)$date->format('m');
                        $day=(int)$date->format('d');
                        
                        $dataAvgW[$i][1]*=$month[(int)((new \DateTime(null ))->setTimestamp($dataAvgW[$i][0])->format('m'))];

                       
                        
                    }
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]['jour']=0;
                        $month[$i]['ete']=0;
                        $month[$i]['soir']=0;
                        $month[$i]['nuit']=0;

                    }
                    $consomation->setCmMonth(PostHoraire::PostHoraire($dataAvgW));
                    $allcm_month[$number]=$request->get('date');;


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
                    $allcm_month[$number]=$request->get('datehoraire');
                    
                    
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
                        $date = new \DateTime(null );
                        $date->setTimestamp($dataAvgW[$i][0]);
                        if(((int)$date->format('w'))==0){
                        $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==1){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==14&&((int)$date->format('m'))==1){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==20&&((int)$date->format('m'))==3){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==9&&((int)$date->format('m'))==4){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==1&&((int)$date->format('m'))==5){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==25&&((int)$date->format('m'))==7){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==13&&((int)$date->format('m'))==8){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif(((int)$date->format('d'))==15&&((int)$date->format('m'))==10){
                            $dataAvgW[$i][1]*=$month[((int)$date->format('m'))]['nuit'];
                        }
                        elseif (((int)$date->format('m')) > 5 && ((int)$date->format('m')) < 9) {
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

        if (($request->get('transport_energie'))==null){
            $consomation->setTransportEng(false);
            
        }
        else{
            $consomation->setTransportEng(true);
            
        }

        if ((($request->get('vershoraire'))<>null)&($request->get('tarif')==0)){
            $consomation->setTypeTarif(1);
        }
        else{ 
        $consomation->setTypeTarif($request->get('tarif'));
        }
            
            $allDateDeb[$number]=$dateDeb;
            $allDateFin[$number]=$dateFin;
            $allDataAvgW[$number]=$dataAvgW;
            $allTarif[$number]=$request->get('tarif');

            $consomation->setallDateDeb($allDateDeb);    
            $consomation->setDateDeb($dateDeb);
            $consomation->setDateDebForm($dateDebForm);
            
            $consomation->setallDateFin($allDateFin);
            $consomation->setDateFin($dateFin);
            $consomation->setallConsomationAnnuel($allDataAvgW);
            $consomation->setConsomationAnnuel($dataAvgW);
            $consomation->setTabTarif($allTarif);
            $consomation->setallCmMonth($allcm_month);

            $alldata1=$project->getConsomation()->getallConsomationAnnuel();
            
            $consomation->setProject($project);
            $project->setConsomation($consomation);
            $entityManager=$this->getDoctrine()->getManager();
            $entityManager->persist($consomation);
            $entityManager->persist($project);
            $entityManager->flush();
            return new JsonResponse([
            'tabTarif'=>$project->getConsomation()->getTabTarif(),
            'allCmMonth'=>$project->getConsomation()->getallCmMonth(),
            'virgdata'=>$dataAvgW,
            'data'=>$dataAvgWtm,
            'data2'=>$monthtmp,
            'dataexl'=>round($dataexl[0][0]),
            'period'=>$date->getTimestamp(),
            'newdata'=>$dataAvgW,
            'alldata'=>$allDataAvgW,
            'nbre'=>count($allDateDeb),
            'alldata1'=>$alldata1,

            
            
            
            
            
            ]);
    }
        return $this->render('project/show.html.twig', [
            'project' => $project,
        ]);
    }


     /**
 

 * @Route("/suppsite/{id}",name="suppsite")
     * @throws \Exception
     */
    public function suppsite(Project $project,Request $request)
    {
        
        if ($request->isXmlHttpRequest()){
            $consomation =$project->getConsomation();
            $allDateDeb =$project->getConsomation()->getallDateDeb();
            $allDateFin =$project->getConsomation()->getallDateFin();
            $allDataAvgW =$project->getConsomation()->getallConsomationAnnuel();
            $allTarif =$project->getConsomation()->getTabTarif();
            $allcm_month =$project->getConsomation()->getallCmMonth();
            $allActivite=$project->getConsomation()->getActivite();
            $allDateconge_deb=$project->getConsomation()->getDatecongeDeb();
            $allDateconge_deb1=$project->getConsomation()->getDatecongeDeb1();
            $allDateconge_deb2=$project->getConsomation()->getDatecongeDeb2();
            $allDateconge_fin=$project->getConsomation()->getDatecongeFin();
            $allDateconge_fin1=$project->getConsomation()->getDatecongeFin1();
            $allDateconge_fin2=$project->getConsomation()->getDatecongeFin2();
            $allHourSlider1=$project->getConsomation()->getHourSlider1();
            $allHourSlider2=$project->getConsomation()->getHourSlider2();
            $allHourSlider3=$project->getConsomation()->getHourSlider3();
            $allHourSlider_dimanche=$project->getConsomation()->getHourSliderDimanche();
            $allHourSlider_samedi=$project->getConsomation()->getHourSliderSamedi();
            $allMonthSlider1=$project->getConsomation()->getMonthSlider1();
            $allMonthSlider2=$project->getConsomation()->getMonthSlider2();
            $allMonthSlider3=$project->getConsomation()->getMonthSlider3();
            $allSaison=$project->getConsomation()->getSaison();
            $allCongeCheck=$project->getConsomation()->getCongeCheck();
            $allDimancheCheck=$project->getConsomation()->getDimancheCheck();
            $allSamediCheck=$project->getConsomation()->getSamediCheck();
            $allVershoraire=$project->getConsomation()->getVershoraire();
            $avgweek=$project->getConsomation()->getAvgweek();
            $allUrlCcv=$project->getConsomation()->getallUrlCcv();
            $allFerieCheck=$project->getConsomation()->getFerieCheck();

           /* $consomationPH=$project->getconsomationPH();
            $productionPH=$project->getproductionPH();
            $auto_consomerPH=$project->getauto_consomerPH();
            $importerPH=$project->getimporterPH();
            $cedeePH=$project->getcedeePH();
            $injectPH=$project->getinjectPH();
            $inject=$project->getinject();
            $auto_consomer=$project->getAutoConsomer();
            $cedee=$project->getCedee();
            $importer=$project->getImporte();

            unset($consomationPH);
            unset($productionPH);
            unset($auto_consomerPH);
            unset($importerPH);
            unset($cedeePH);
            unset($injectPH);
            unset($inject);
            unset($auto_consomer);
            unset($cedee);
            unset($importer);*/


            

            unset($avgweek[$request->get('number')]);
           
            unset($allDateDeb[$request->get('number')]); 
            unset($allDateFin[$request->get('number')]); 
            unset($allDataAvgW[$request->get('number')]); 
            unset($allTarif[$request->get('number')]); 
            unset($allcm_month[$request->get('number')]); 
            unset($allActivite[$request->get('number')]); 
            unset($allDateconge_deb[$request->get('number')]); 
            unset($allDateconge_deb1[$request->get('number')]); 
            unset($allDateconge_deb2[$request->get('number')]); 
            unset($allDateconge_fin[$request->get('number')]); 
            unset($allDateconge_fin1[$request->get('number')]); 
            unset($allDateconge_fin2[$request->get('number')]); 
            unset($allHourSlider1[$request->get('number')]); 
            unset($allHourSlider2[$request->get('number')]); 
            unset($allHourSlider3[$request->get('number')]); 
            unset($allHourSlider_dimanche[$request->get('number')]); 
            unset($allHourSlider_samedi[$request->get('number')]); 
            unset($allMonthSlider1[$request->get('number')]); 
            unset($allMonthSlider2[$request->get('number')]); 
            unset($allMonthSlider3[$request->get('number')]); 
            unset($allSaison[$request->get('number')]); 
            unset($allCongeCheck[$request->get('number')]); 
            unset($allDimancheCheck[$request->get('number')]); 
            unset($allSamediCheck[$request->get('number')]); 
            unset($allVershoraire[$request->get('number')]); 
            unset($allFerieCheck[$request->get('number')]);

            $avgweek=array_values($avgweek);
           
            $allDateDeb=array_values($allDateDeb); 
            $allDateFin=array_values($allDateFin); 
            $allDataAvgW=array_values($allDataAvgW); 
            $allTarif=array_values($allTarif); 
            $allcm_month=array_values($allcm_month); 
            $allActivite=array_values($allActivite); 
            $allDateconge_deb=array_values($allDateconge_deb); 
            $allDateconge_deb1=array_values($allDateconge_deb1); 
            $allDateconge_deb2=array_values($allDateconge_deb2); 
            $allDateconge_fin=array_values($allDateconge_fin); 
            $allDateconge_fin1=array_values($allDateconge_fin1); 
            $allDateconge_fin2=array_values($allDateconge_fin2); 
            $allHourSlider1=array_values($allHourSlider1); 
            $allHourSlider2=array_values($allHourSlider2); 
            $allHourSlider3=array_values($allHourSlider3); 
            $allHourSlider_dimanche=array_values($allHourSlider_dimanche); 
            $allHourSlider_samedi=array_values($allHourSlider_samedi); 
            $allMonthSlider1=array_values($allMonthSlider1); 
            $allMonthSlider2=array_values($allMonthSlider2); 
            $allMonthSlider3=array_values($allMonthSlider3); 
            $allSaison=array_values($allSaison); 
            $allCongeCheck=array_values($allCongeCheck); 
            $allDimancheCheck=array_values($allDimancheCheck); 
            $allSamediCheck=array_values($allSamediCheck); 
            $allVershoraire=array_values($allVershoraire);
            $allFerieCheck=array_values($allFerieCheck);  


            $project->setconsomationPH([]);
            $project->setproductionPH([]);
            $project->setauto_consomerPH([]);
            $project->setimporterPH([]);
            $project->setcedeePH([]);
            $project->setinjectPH([]);
            $project->setinject([]);
            $project->setAutoConsomer([]);
            $project->setCedee([]);
            $project->setImporte([]);
           


            $project->getConsomation()->setallDateDeb($allDateDeb);
            $project->getConsomation()->setallDateFin($allDateFin);
            $project->getConsomation()->setallConsomationAnnuel($allDataAvgW);
            $project->getConsomation()->setTabTarif($allTarif);
            $project->getConsomation()->setallCmMonth($allcm_month);
            $project->getConsomation()->setActivite($allActivite);
            $project->getConsomation()->setDatecongeDeb($allDateconge_deb);
            $project->getConsomation()->setDatecongeDeb1($allDateconge_deb1);
            $project->getConsomation()->setDatecongeDeb2($allDateconge_deb2);
            $project->getConsomation()->setDatecongeFin($allDateconge_fin);
            $project->getConsomation()->setDatecongeFin1($allDateconge_fin1);
            $project->getConsomation()->setDatecongeFin2($allDateconge_fin2);
            $project->getConsomation()->setHourSlider1($allHourSlider1);
            $project->getConsomation()->setHourSlider2($allHourSlider2);
            $project->getConsomation()->setHourSlider3($allHourSlider3);
            $project->getConsomation()->setHourSliderDimanche($allHourSlider_dimanche);
            $project->getConsomation()->setHourSliderSamedi($allHourSlider_samedi);
            $project->getConsomation()->setMonthSlider1($allMonthSlider1);
            $project->getConsomation()->setMonthSlider2($allMonthSlider2);
            $project->getConsomation()->setMonthSlider3($allMonthSlider3);
            $project->getConsomation()->setSaison($allSaison);
            $project->getConsomation()->setCongeCheck($allCongeCheck);
            $project->getConsomation()->setDimancheCheck($allDimancheCheck);
            $project->getConsomation()->setSamediCheck($allSamediCheck);
            $project->getConsomation()->setVershoraire($allVershoraire);
            $project->getConsomation()->setFerieCheck($allFerieCheck);
            
            
                unset($allUrlCcv[$request->get('number')]); 
                $allUrlCcv=array_values($allUrlCcv); 
                $project->getConsomation()->setallUrlCcv($allUrlCcv);
                $allUrlCcv=array_values($allUrlCcv); 

            

            $project->getConsomation()->setAvgweek($avgweek);
            

            $consomation->setProject($project);
            $project->setConsomation($consomation);
            $entityManager=$this->getDoctrine()->getManager();
            $entityManager->persist($consomation);
            $entityManager->persist($project);
            $entityManager->flush();
        }
        return new JsonResponse(['avg'=>$project->getConsomation()->getAvgweek(), 'cm'=>$allcm_month,
        'aut'=>$project->getAutoConsomer(),
        'ced'=>$project->getCedee(),
        
        'imp'=>$project->getImporte() ]);

        return $this->render('project/show.html.twig', [
            'project' => $project,
            'i'=>$request->get('number')
        ]);
    }


     /**
 

 * @Route("/suppcc/{id}",name="suppcc")
     * @throws \Exception
     */
    public function suppcc(Project $project,Request $request)
    {
        
        if ($request->isXmlHttpRequest()){
            $consomation =$project->getConsomation();
            $avgweek=$project->getConsomation()->getAvgweek();
            $allUrlCcv=$project->getConsomation()->getallUrlCcv();
            $avgweek[$request->get('number')]=[];
            
            $allUrlCcv[$request->get('number')]="";
            $project->getConsomation()->setAvgweek($avgweek);
            $project->getConsomation()->setallUrlCcv($allUrlCcv);
            

            $consomation->setProject($project);
            $project->setConsomation($consomation);
            $entityManager=$this->getDoctrine()->getManager();
            $entityManager->persist($consomation);
            $entityManager->persist($project);
            $entityManager->flush();
        }
        return new JsonResponse(['avg'=>$project->getConsomation()->getAvgweek()]);

        return $this->render('project/show.html.twig', [
            'project' => $project,
            'i'=>$request->get('number')
        ]);
    }
    /**
 

 * @Route("/editpro/{id}",name="editpro")
     * @throws \Exception
     */
    public function getdata(Project $project,Request $request)
    {
        
    if ($request->isXmlHttpRequest()){
        $srcprod=0;
        if($project->getPvgis() != null){
            $srcprod=1;
            $getLat=$project->getPvgis()->getLat();
            $getAzimuth=$project->getPvgis()->getAzimuth();
            $getLon=$project->getPvgis()->getLon();
            $getLoss=$project->getPvgis()->getLoss();
            $getMountingType=$project->getPvgis()->getMountingType();
            $getPeakPower=$project->getPvgis()->getPeakPower();
            $getPvTech=$project->getPvgis()->getPvTech();
            $getDegradation=$project->getPvgis()->getDegradation();
            $getSlop=$project->getPvgis()->getSlop();
            }
            else{

            $getLat=36;
            $getAzimuth=[0,0,0];
            $getLon=10;
            $getLoss=14;
            $getMountingType=0;
            $getPeakPower=[0,0,0];
            $getPvTech='';
            $getDegradation=0.5;
            $getSlop=[30,30,30];

            }

            if ($project->getNinja() != null){
                $srcprod=2;
                $getLat_n=$project->getNinja()->getLat();
                $getAzimuth_n=$project->getNinja()->getAzimuth();
                $getLon_n=$project->getNinja()->getLon();
                $getLoss_n=$project->getNinja()->getLoss();
                $getTracking_n=$project->getNinja()->getTracking();
                $getCapacity_n=$project->getNinja()->getCapacity();
                $getRaddatabase_n=$project->getNinja()->getRaddatabase();
                $getTilt_n=$project->getNinja()->getTilt();
                $getDegradation_n=$project->getNinja()->getDegradation();   
            } 
            else{
                $getLat_n=36;
                $getAzimuth_n=0;
                $getLon_n=10;
                $getLoss_n=14;
                $getTracking_n=0;
                $getCapacity_n=0;
                $getRaddatabase_n='';
                $getTilt_n=30;
                $getDegradation_n=0.5;
            } 

            if($project->getCsvProd()!=null){
                $srcprod=3;
                $deg_c=$project->getCsvProd()->getDegradation();
                $pui_c=$project->getCsvProd()->getPuissence();
                $path_c=$project->getCsvProd()->getPath();
            }
            else{
                $deg_c=0.5;
                $pui_c=0;
                $path_c='';
            }   
            
            if($project->getFinance()!= null){
                if($project->getFinance()->getCredit()!=null){
                    $dette=$project->getFinance()->getMontantDette();
                    $interet=$project->getFinance()->getTauxInteret();
                    $grace=$project->getFinance()->getDelaiGrace();
                    $matur=$project->getFinance()->getMaturiteProj();
                }
                else{
                    $dette=0;
                    $interet=0;
                    $grace=0;
                    $matur=0;

                }
                $capex=$project->getFinance()->getCapex();
            $atachat=$project->getFinance()->getAugTarifAchat();
            $atvente=$project->getFinance()->getAugTarifVende();
            $duree=$project->getFinance()->getDureeProj();
            $opex=$project->getFinance()->getOpex();
            $sub=$project->getFinance()->getSubvention();
            $actu=$project->getFinance()->getTauxActualisation();
            $credit=$project->getFinance()->getCredit();


            }
            else{
                $dette=0;
                $interet=9;
                $grace=0;
                $matur=7;
                $capex=1000;
                $atachat=7;
                $atvente=5;
                $duree=25;
                $opex=1;
                $sub=0;
                $actu=8;
                $credit=0;

            }   



return new JsonResponse(['tabTarif'=>$project->getConsomation()->getTabTarif(),'allCmMonth'=>$project->getConsomation()->getallCmMonth(),
            'allActivite'=>$project->getConsomation()->getActivite(),
            'allDateconge_deb'=>$project->getConsomation()->getDatecongeDeb(),
            'allDateconge_deb1'=>$project->getConsomation()->getDatecongeDeb1(),
            'allDateconge_deb2'=>$project->getConsomation()->getDatecongeDeb2(),
            'allDateconge_fin'=>$project->getConsomation()->getDatecongeFin(),
            'allDateconge_fin1'=>$project->getConsomation()->getDatecongeFin1(),
            'allDateconge_fin2'=>$project->getConsomation()->getDatecongeFin2(),
            'allHourSlider1'=>$project->getConsomation()->getHourSlider1(),
            'allHourSlider2'=>$project->getConsomation()->getHourSlider2(),
            'allHourSlider3'=>$project->getConsomation()->getHourSlider3(),
            'allHourSlider_dimanche'=>$project->getConsomation()->getHourSliderDimanche(),
            'allHourSlider_samedi'=>$project->getConsomation()->getHourSliderSamedi(),
            'allMonthSlider1'=>$project->getConsomation()->getMonthSlider1(),
            'allMonthSlider2'=>$project->getConsomation()->getMonthSlider2(),
            'allMonthSlider3'=>$project->getConsomation()->getMonthSlider3(),
            'allSaison'=>$project->getConsomation()->getSaison(),
            'allCongeCheck'=>$project->getConsomation()->getCongeCheck(),
            'allDimancheCheck'=>$project->getConsomation()->getDimancheCheck(),
            'allSamediCheck'=>$project->getConsomation()->getSamediCheck(),
            'allVershoraire'=>$project->getConsomation()->getVershoraire(),
            'transport'=>$project->getConsomation()->getTransportEng(),
            'datedeb'=>$project->getConsomation()->getDateDeb(),
            'urlccv'=>$project->getConsomation()->getallUrlCcv(),
            'datedebform'=>$project->getConsomation()->getDateDebForm(),
            'allFerieCheck'=>$project->getConsomation()->getFerieCheck(),

           
            'lat'=>$getLat,
            'azimuth'=>$getAzimuth,
            'lon'=>$getLon,
            'loss'=>$getLoss,
            'mount'=>$getMountingType,
            'power'=>$getPeakPower,
            'pvtech'=>$getPvTech,
            'deg'=>$getDegradation,
            'slop'=>$getSlop,  
            
            'lat_n'=>$getLat_n,
            'azimuth_n'=>$getAzimuth_n,
            'lon_n'=>$getLon_n,
            'loss_n'=>$getLoss_n,
            'track_n'=>$getTracking_n,
            'capacity_n'=>$getTracking_n,
            'radd_n'=>$getRaddatabase_n,
            'tilt_n'=>$getTilt_n,
            'deg_n'=>$getDegradation_n,   

            'deg_c'=>$deg_c,
            'pui_c'=>$pui_c,
            'path_c'=>$path_c,

            'srcprod'=>$srcprod,

            'capex'=>$capex,
            'atachat'=>$atachat,
            'atvente'=>$atvente,
            'duree'=>$duree,
            'opex'=>$opex,
            'sub'=>$sub,
            'actu'=>$actu,
            'credit'=>$credit,
            'dette'=>$dette,
            'interet'=>$interet,
            'grace'=>$grace,
            'matur'=>$matur
            
                                      
]);
}
    return $this->render('project/show.html.twig', [
        'project' => $project,
        'i'=>$request->get('number')
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

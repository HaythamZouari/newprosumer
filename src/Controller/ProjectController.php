<?php

namespace App\Controller;

use App\Entity\Consomation;
use App\Entity\Project;
use App\Form\ProjectType;
use App\Repository\ProjectRepository;
use App\Service\ExcelReader;
use App\Service\FileUpload;
use App\Service\PostHoraire;
use Carbon\CarbonPeriod;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Routing\Annotation\Route;

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
        $date = new \DateTime();
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
                               $tarifUni[0][$i][$j]=$tarifUni[0][$i][$j]+$datum[1];
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
                    $tarifUni[1][$i][$j]=$tarifUni[1][$i][$j];
                }
            }
        }
        for ($i =0 ; $i<7;$i++){
            for($j =0;$j<=23;$j++){
                $tarifUni[0][$i][$j]/=$factor[0][$i][$j];
                $tarifUni[1][$i][$j]/=$factor[1][$i][$j];
            }
        }
        for ($i =0 ; $i<7;$i++) {
            array_push($tarifUni[0][$i], $tarifUni[0][$i][0]);
            array_push($tarifUni[0][$i], $tarifUni[0][$i][1]);
            array_splice($tarifUni[0][$i], 0, 2);


        }


        $project->getConsomation()->setAvgweek($tarifUni);
        $project->getConsomation()->setUrlCcv($filePath);
        $entityManager=$this->getDoctrine()->getManager();
        $entityManager->persist($project);
        $entityManager->flush();
        $session->set('avgweek',$tarifUni);
        $session->set('data',$data);
        return new JsonResponse(['data'=>$project->getConsomation()->getAvgweek(),
        'factor'=>$factor,
        'somme'=>$tarifUni,
        'courbe'=>$data]);

    }

    /**
     * @Route("/{id}", name="project_show", methods={"GET","POST"})
     * @throws \Exception
     */
    public function show(Project $project,Request $request,Session $session)
    {

        if ($request->isXmlHttpRequest()){
            $consomation = new Consomation();
            $dateDeb= new \DateTime($request->get('dateDeb'));
            $dateDebexel= new \DateTime();
            $dateDebexel->setTimestamp($session->get('dateDebExl'));
            $dateFinexel= new \DateTime();
            $dateFinexel->setTimestamp($session->get('dateFinExl'));
            $dateFin= new \DateTime($request->get('dateDeb'));
            $dateFin->add(new \DateInterval('P1Y'));
            $avgweek=$project->getConsomation()->getAvgweek();
            $dataAvgW=[];
            $i =0;
            if ($session->get('avgweek')[0][0][0]===$avgweek[0][0][0]){
                $dataexl = $session->get('data');
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
                    $date = new \DateTime();
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
                $dataAvgW[count($dataAvgW)-1][0]=$dataAvgW[count($dataAvgW)-1][0]-31536000;
                if($request->get('tarif')==0){
                    $monthp = $request->get('date');
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]=0;

                    }
                    foreach ($dataAvgW as $item) {
                        $date = new \DateTime();
                        $date->setTimestamp($item[0]);
                        $month[((int)$date->format('m'))]+=$item[1];
                    }
                    $monthtmp=$month;
                    for($i =1 ; $i <13; $i++){
                        $month[$i]=(float)$monthp[$i]/$month[$i];
                    }

                    $dataAvgWtm=$dataAvgW;
                    for ($i=0;$i<count($dataAvgW);$i++) {
                        $date = new \DateTime();
                        $date->setTimestamp($dataAvgW[$i][0]);
                        $months=(int)$date->format('m');
                        $day=(int)$date->format('d');
                        $dataAvgW[$i][1]*=$month[(int)((new \DateTime())->setTimestamp($dataAvgW[$i][0])->format('m'))];
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
                        $date = new \DateTime();
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
            else {
                if(((int)$dateDeb->format('m') )>5 && ((int)$dateDeb->format('m'))<9) {
                    $dataAvgW[] = [$dateDeb->getTimestamp(),$avgweek[0][((int)$dateDeb->format('w'))][((int)$dateDeb->format('H'))]];
                }
                else
                    $dataAvgW[] = [$dateDeb->getTimestamp(),$avgweek[1][((int)$dateDeb->format('w'))][((int)$dateDeb->format('H'))]];
                $period = CarbonPeriod::create($dateDeb->format('y-m-d'),'PT1H',$dateFin->format('y-m-d') , CarbonPeriod::EXCLUDE_START_DATE);
                //creating a period to loop on it
                foreach ($period as $key=>$date) {
                    if(((int)$date->format('m') )>5 && ((int)$date->format('m'))<9) {
                        $dataAvgW[] = [$date->getTimestamp(),$avgweek[0][((int)$date->format('w'))][((int)$date->format('H'))]];
                    }
                    else{
                        $dataAvgW[] = [$date->getTimestamp(),$avgweek[1][((int)$date->format('w'))][((int)$date->format('H'))]];
                    }

                }
                $dataAvgWtm=$dataAvgW;
                array_pop($dataAvgW);

                for ($i=0;$i<count($dataAvgW);$i++) {
                    $date = new \DateTime();
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
                $dataAvgW[count($dataAvgW)-1][0]=$dataAvgW[count($dataAvgW)-1][0]-31536000;
                if($request->get('tarif')==0){
                    $monthp = $request->get('date');
                    $month=[];
                    for($i=0;$i<13;$i++){
                        $month[$i]=0;

                    }
                    foreach ($dataAvgW as $item) {
                        $date = new \DateTime();
                        $date->setTimestamp($item[0]);
                        $month[((int)$date->format('m'))]+=$item[1];
                    }
                    $monthtmp=$month;
                    for($i =1 ; $i <13; $i++){
                        $month[$i]=(float)$monthp[$i]/$month[$i];
                    }

                    $dataAvgWtm=$dataAvgW;
                    for ($i=0;$i<count($dataAvgW);$i++) {
                        $date = new \DateTime();
                        $date->setTimestamp($dataAvgW[$i][0]);
                        $months=(int)$date->format('m');
                        $day=(int)$date->format('d');
                        $dataAvgW[$i][1]*=$month[(int)((new \DateTime())->setTimestamp($dataAvgW[$i][0])->format('m'))];
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
                        $date = new \DateTime();
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
            return new JsonResponse(['virgdata'=>$dataAvgW,'data'=>$dataAvgWtm,'data2'=>$monthtmp]);
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

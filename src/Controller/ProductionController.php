<?php

namespace App\Controller;

use DateTime;
use App\Entity\Ninja;
use App\Entity\Pvgis;
use App\Entity\CsvProd;
use App\Entity\Project;
use Carbon\CarbonPeriod;
use App\Event\ProjectEvent;
use App\Service\FileUpload;
use App\Service\Datesorting;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class ProductionController extends AbstractController
{
    /**
     * @Route("/pvgis/{id}", name="pvgis")
     */
    public function pvgis(LoggerInterface $logger,EventDispatcherInterface $eventDispatcher, Project $project, Request $request)
    {
        $pvgis = new Pvgis();
        $pvgis->setProject($project);
        $pvgis->setLat((float)$request->get('lat'));
        $pvgis->setAzimuth((float)$request->get('aspect'));
        $pvgis->setLon((int)$request->get('lon'));
        $pvgis->setLoss((float)$request->get('loss'));
        $pvgis->setMountingType((int)$request->get('trackingtype'));
        $pvgis->setPeakPower(((float)$request->get('peakpower'))+((float)$request->get('peakpower2'))+((float)$request->get('peakpower3')));
        $pvgis->setPvTech($request->get('technologies'));
        $pvgis->setSlop((float)$request->get('angle'));
        $httpClient = HttpClient::create();
        $response = $httpClient->request('GET',
            'http://re.jrc.ec.europa.eu/pvgis5/seriescalc.php?'.
            '&lat='.$request->get('lat').
            '&lon='.$request->get('lon').
            '&raddadtabase'.$request->get('raddadtabase').
            '&peakpower='.$request->get('peakpower').
            '&pvtechchoice='.$request->get('technologies').
            '&loss='.$request->get('loss').
            '&angle='.$request->get('angle').
            '&aspect='.$request->get('aspect').
            '&trackingtype'.$request->get('trackingtype').
            '&outputformat=basic'.
            '&startyear=2015'.
            '&endyear=2015'.
            '&pvcalculation=1'
        ); 
        


        $lines = explode(PHP_EOL, $response->getContent());
        
        $array=[];
        
        $data=[];
        foreach ($lines as $line){
            $array[]=str_getcsv($line);
        }
       
        $period = CarbonPeriod::create('2017-01-01 00:00','PT1H','2017-12-31 23:00','America/Toronto' /*, CarbonPeriod::EXCLUDE_START_DATE*/);
        $i=2;
        foreach ($period as $key=>$date) {
            /*$string=$array[$i][0];*/
            $data[]=[(int)$date->getTimestamp(),(float)($array[$i][1])/1000];

            $i++;

        }

        

        
        if ((($request->get('peakpower2'))!=0) && (($request->get('peakpower3'))==0)) {
            $response2 = $httpClient->request('GET',
                'http://re.jrc.ec.europa.eu/pvgis5/seriescalc.php?'.
                '&lat='.$request->get('lat').
                '&lon='.$request->get('lon').
                '&raddadtabase'.$request->get('raddadtabase').
                '&peakpower='.$request->get('peakpower2').
                '&pvtechchoice='.$request->get('technologies').
                '&loss='.$request->get('loss2').
                '&angle='.$request->get('angle2').
                '&aspect='.$request->get('aspect2').
                '&trackingtype'.$request->get('trackingtype2').
                '&outputformat=basic'.
                '&startyear=2015'.
                '&endyear=2015'.
                '&pvcalculation=1'       
            
            );
            $array=[];
            $array2=[];

            $lines2 = explode(PHP_EOL, $response2->getContent());

            foreach ($lines2 as $line){
                $array2[]=str_getcsv($line);
            }

            $lines = explode(PHP_EOL, $response->getContent());
        
           
            
            $data=[];
            foreach ($lines as $line){
                $array[]=str_getcsv($line);
            }
           
            $period = CarbonPeriod::create('2017-01-01 00:00','PT1H','2017-12-31 23:00','America/Toronto' /*, CarbonPeriod::EXCLUDE_START_DATE*/);
            $i=2;
            foreach ($period as $key=>$date) {
                /*$string=$array[$i][0];*/
                $data[]=[(int)$date->getTimestamp(),((float)($array[$i][1])+(float)($array2[$i][1]))/1000];
    
                $i++;
    
            }

        };


        if (($request->get('peakpower3'))!=0) {
            $response2 = $httpClient->request('GET',
                'http://re.jrc.ec.europa.eu/pvgis5/seriescalc.php?'.
                '&lat='.$request->get('lat').
                '&lon='.$request->get('lon').
                '&raddadtabase'.$request->get('raddadtabase').
                '&peakpower='.$request->get('peakpower2').
                '&pvtechchoice='.$request->get('technologies').
                '&loss='.$request->get('loss2').
                '&angle='.$request->get('angle2').
                '&aspect='.$request->get('aspect2').
                '&trackingtype'.$request->get('trackingtype2').
                '&outputformat=basic'.
                '&startyear=2015'.
                '&endyear=2015'.
                '&pvcalculation=1'       
            
            );

            $response3 = $httpClient->request('GET',
                'http://re.jrc.ec.europa.eu/pvgis5/seriescalc.php?'.
                '&lat='.$request->get('lat').
                '&lon='.$request->get('lon').
                '&raddadtabase'.$request->get('raddadtabase').
                '&peakpower='.$request->get('peakpower3').
                '&pvtechchoice='.$request->get('technologies').
                '&loss='.$request->get('loss3').
                '&angle='.$request->get('angle3').
                '&aspect='.$request->get('aspect3').
                '&trackingtype'.$request->get('trackingtype3').
                '&outputformat=basic'.
                '&startyear=2015'.
                '&endyear=2015'.
                '&pvcalculation=1'       
            
            );

            
            $array=[];
            $array2=[];
            $array3=[];

            $lines2 = explode(PHP_EOL, $response2->getContent());
            $lines3 = explode(PHP_EOL, $response3->getContent());
            $lines = explode(PHP_EOL, $response->getContent());
        
            
            $data=[];
            foreach ($lines as $line){
                $array[]=str_getcsv($line);
            }

            foreach ($lines2 as $line){
                $array2[]=str_getcsv($line);
            }

            foreach ($lines3 as $line){
                $array3[]=str_getcsv($line);
            }

           
            $period = CarbonPeriod::create('2017-01-01 00:00','PT1H','2017-12-31 23:00','America/Toronto' /*, CarbonPeriod::EXCLUDE_START_DATE*/);
            $i=2;
            foreach ($period as $key=>$date) {
                /*$string=$array[$i][0];*/
                $data[]=[(int)$date->getTimestamp(),((float)($array[$i][1])+(float)($array2[$i][1])+(float)($array3[$i][1]))/1000];
    
                $i++;
    
            }

        };
       /* $data[count($data)-1][0]=$data[count($data)-1][0]-31536000;*/
        /*
            for($i=11;$i<8771;$i++){
            $string=$array[$i][0];
            $data[]=[strtotime(substr($string,0,4).
                '/'.
                substr($string,4,2).
                '/'.substr($string,6,2).
                ' '.(int)((substr($string,9,2))+1).':00'),(float)($array[$i][1]/1000)];

        }
        */

        $logger->info('testt',$data);
        $pvgis->setResult(Datesorting::SorteDate($project->getConsomation()->getConsomationAnnuel()[0][0],$data));
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->persist($pvgis);
        $project->setCsvProd(null);
        $project->setNinja(null);
        $entityManager->flush();
        $entityManager->persist($project);
        $entityManager->flush();
        $projectEvent = new ProjectEvent($project);
        $eventDispatcher->dispatch(
            ProjectEvent::NAME,
            $projectEvent
        );
        return new JsonResponse(['data'=>$data,'array'=>$array,'data2'=>Datesorting::SorteDate($project->getConsomation()->getConsomationAnnuel()[0][0],$data) ]);
    }
    /**
     * @Route("/ninja/{id}", name="ninja")
     */
    public function ninja(Project $project , EventDispatcherInterface $eventDispatcher,Request $request)
    {
        $ninja = new Ninja();
        $ninja->setProject($project);
        $ninja->setLat((float)$request->get('lat'));
        $ninja->setAzimuth((float)$request->get('azimuth'));
        $ninja->setLon((int)$request->get('lon'));
        $ninja->setLoss((float)$request->get('loss'));
        $ninja->setTracking((int)$request->get('tracking'));
        $ninja->setCapacity((float)$request->get('capacity'));
        $ninja->setRaddatabase($request->get('raddatabase'));
        $ninja->setTilt((float)$request->get('tilt'));
        $httpClient = HttpClient::create(['auth_bearer'=>'4171ff415c2962940501acb99ba088c98e6f6134']);
        $response = $httpClient->request('GET',
            'https://www.renewables.ninja/api/data/pv?lat='.$request->get('lat').
            '&lon='.$request->get('lon').
            '&date_from=2019-01-01&date_to=2019-12-31'.
            '&dataset='.$request->get('raddatabase').
            '&capacity='.$request->get('capacity').
            '&system_loss='.($request->get('loss')/100).
            '&tracking='.$request->get(('tracking')).
            '&tilt='.$request->get('tilt').
            '&azim='.$request->get('azimuth').
            '&format=json'
        );
        
        $ac = $response->toArray()['data'];
        
        /*$ac_elec= current($ac)[0]->toArray()['electricity'];*/
       
        while ($dat = current($ac)) {
            
            $data1[]=[key($ac),array_values($dat)[0]];

            next($ac);
        }
        
        

    $period = CarbonPeriod::create('2014-01-01 00:00','PT1H','2014-12-31 23:00','America/Toronto' /*, CarbonPeriod::EXCLUDE_START_DATE*/);
    $i=0;
    foreach ($period as $key=>$date) {
        /*$string=$array[$i][0];*/
        $data[]=[(int)$date->getTimestamp(),(float)($data1[$i][1])];

        $i++;

    }

            
            $ninja->setResult(Datesorting::SorteDate($project->getConsomation()->getConsomationAnnuel()[0][0],$data));
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->persist($ninja);
            $project->setCsvProd(null);
            $project->setPvgis(null);
            $entityManager->flush();
            $entityManager->persist($project);
            $entityManager->flush();
            $projectEvent = new ProjectEvent($project);
            $eventDispatcher->dispatch(
                ProjectEvent::NAME,
                $projectEvent
        );
        return new JsonResponse(['data'=>$response->toArray(),'values'=>$data,'dat'=>$ac]);
    }
    /**
     * @Route("/readcsv/{id}",name="readcsv")
     */
    public function readcsv(EventDispatcherInterface $eventDispatcher,Request $request,FileUpload $fileUpload,Project $project){
        $csvreader = new CsvProd();
        $result=[];

        $file = $request->files->get('file');
        $filePath =$fileUpload->uploadcsv($file,'production');
        //delete the first 13 lines of the csv code
        shell_exec('sed -i 1,13d uploads/'.$filePath);
        $csv = array_map('str_getcsv', file('uploads/'.$filePath));
        for($i=0;$i<count($csv);$i++ ){
            $csv[$i]=explode(';',$csv[$i][0]);
            $result[$i][0]= DateTime::createFromFormat('d/m/Y H:i', $csv[$i][0])->getTimestamp()+1200;
            $result[$i][1]=(float)$csv[$i][1];
        }
        $csvreader->setPath('uploads/'.$filePath);
        $csvreader->setResult(Datesorting::SorteDate($project->getConsomation()->getConsomationAnnuel()[0][0],$result));
        //$csvreader->setResult($result);
        $csvreader->setPuissence(((float)$request->get('csvpuiss')));
        $csvreader->setProject($project);
        $entityManager = $this->getDoctrine()->getManager();
        $entityManager->persist($csvreader);
        $entityManager->flush();
        $project->setPvgis(null);
        $entityManager->persist($project);
        $entityManager->flush();
        $projectEvent = new ProjectEvent($project);
        $eventDispatcher->dispatch(
            ProjectEvent::NAME,
            $projectEvent
        );
        return new JsonResponse(['data'=>Datesorting::SorteDate($project->getConsomation()->getConsomationAnnuel()[0][0],$result),'da'=>$csv]);
    }
}

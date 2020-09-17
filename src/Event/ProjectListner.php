<?php


namespace App\Event;


use App\Service\Datesorting;
use App\Service\PostHoraire;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ProjectListner implements EventSubscriberInterface
{
    /**
     * @var EntityManagerInterface
     */
    private $manager;
    /**
     * ProjectListner constructor.
     */
    public function __construct(EntityManagerInterface $manager)
    {
        $this->manager=$manager;
    }

    /**
     * Returns an array of event names this subscriber wants to listen to.
     *
     * The array keys are event names and the value can be:
     *
     *  * The method name to call (priority defaults to 0)
     *  * An array composed of the method name to call and the priority
     *  * An array of arrays composed of the method names to call and respective
     *    priorities, or 0 if unset
     *
     * For instance:
     *
     *  * ['eventName' => 'methodName']
     *  * ['eventName' => ['methodName', $priority]]
     *  * ['eventName' => [['methodName1', $priority], ['methodName2']]]
     *
     * @return array The event names to listen to
     */
    public static function getSubscribedEvents()
    {
        return [
            ProjectEvent::NAME => 'onProjectEvent',

        ];
    }
    public function onProjectEvent(ProjectEvent $event){
        
        $project=$event->getProject();
        $production=[];
        $auto_consomer=[];
        $cedee=[];
        $importer=[];
        $inject=[];
        
       

        $consomation=$project->getConsomation()->getallConsomationAnnuel();
        for ($j=0;$j<count($consomation);$j++){
            
            for($i=0;$i<13;$i++){
                $auto_consomerPH[$j][$i]['jour']=0;
                $auto_consomerPH[$j][$i]['ete']=0;
                $auto_consomerPH[$j][$i]['soir']=0;
                $auto_consomerPH[$j][$i]['nuit']=0;

                $consomationPH[$j][$i]['jour']=0;
                $consomationPH[$j][$i]['ete']=0;
                $consomationPH[$j][$i]['soir']=0;
                $consomationPH[$j][$i]['nuit']=0;

                $consomationtotPH[$i]['jour']=0;
                $consomationtotPH[$i]['ete']=0;
                $consomationtotPH[$i]['soir']=0;
                $consomationtotPH[$i]['nuit']=0;

                $cedeePH[$j][$i]['jour']=0;
                $cedeePH[$j][$i]['ete']=0;
                $cedeePH[$j][$i]['soir']=0;
                $cedeePH[$j][$i]['nuit']=0;

                $importerPH[$j][$i]['jour']=0;
                $importerPH[$j][$i]['ete']=0;
                $importerPH[$j][$i]['soir']=0;
                $importerPH[$j][$i]['nuit']=0;

                $injectPH[$i]['jour']=0;
                $injectPH[$i]['ete']=0;
                $injectPH[$i]['soir']=0;
                $injectPH[$i]['nuit']=0;




            }
        }


        if($project->getPvgis() != null)
            $production[0]=$project->getPvgis()->getResult() ;
        if($project->getCsvProd() != null)
            $production[0]=$project->getCsvProd()->getResult();
        if ($project->getNinja() != null)
            $production[0]=$project->getNinja()->getResult();
            
        if($project->getConsomation()->getTransportEng()==0){
           
            $c=1;
            for ($i=0;$i<count($consomation[0]);$i++){
                if($consomation[0][$i][1]<$production[0][$i][1]){
                    $auto_consomer[0][$i]=[$consomation[0][$i][0],$consomation[0][$i][1]];
                    $cedee[0][$i]=[$consomation[0][$i][0],($production[0][$i][1]-$auto_consomer[0][$i][1])];
                    $importer[0][$i]=[$consomation[0][$i][0],($consomation[0][$i][1]-$auto_consomer[0][$i][1])];
                   
                    $inject[$i]=[$consomation[0][$i][0],($production[0][$i][1]-$auto_consomer[0][$i][1])];
                }
                else
                    $auto_consomer[0][$i]=[$consomation[0][$i][0],$production[0][$i][1]];
                    $cedee[0][$i]=[$consomation[0][$i][0],($production[0][$i][1]-$auto_consomer[0][$i][1])];
                    $importer[0][$i]=[$consomation[0][$i][0],($consomation[0][$i][1]-$auto_consomer[0][$i][1])];
                    
                    $inject[$i]=[$consomation[0][$i][0],$production[0][$i][1]-$auto_consomer[0][$i][1]];
            }  

            $consomationPH[0]=PostHoraire::PostHoraire($consomation[0]);
            $auto_consomerPH[0]=PostHoraire::PostHoraire($auto_consomer[0]);
            $importerPH[0]=PostHoraire::PostHoraire($importer[0]);
            for($i=0;$i<13;$i++){
                $CedePH[0][$i]['jour']=0;
                $CedePH[0][$i]['ete']=0;
                $CedePH[0][$i]['soir']=0;
                $CedePH[0][$i]['nuit']=0;  
            }


        } 
        else{
            $c=0;
            for ($i=0;$i<count($consomation[0]);$i++){
                
                $inject[$i]=[$consomation[0][$i][0],$production[0][$i][1]];
            }       
        }  

        for ($i=0;$i<count($consomation[0]);$i++){
            $consomationtot1[$i]=0;
            $consomationtot[$i][1]=0;
            $consomationtot[$i][0]=0;
            $min[$i]=0;
            $ratio[$i]=0;
        }
        
        for ($i=0;$i<count($consomation[0]);$i++){
            for ($j=$c;$j<count($consomation);$j++){
                $consomationtot1[$i]=$consomation[$j][$i][1];
                $consomationtot[$i][1]=$consomationtot1[$i]+$consomationtot[$i][1];
            
            }
        }

        for ($i=0;$i<count($project->getConsomation()->getallConsomationAnnuel()[0]);$i++){
            $consomationtot[$i]=[$consomation[0][$i][0],$consomationtot[$i][1]];
        }
        
       

        for ($j=0;$j<count($consomation);$j++){
            $consomationPH[$j]=PostHoraire::PostHoraire($consomation[$j]);
        }

        $consomationtotPH=PostHoraire::PostHoraire($consomationtot);
        $injectPH=PostHoraire::PostHoraire($inject);
        $productionPH=PostHoraire::PostHoraire($production[0]);

        

        for ($j=$c;$j<count($consomation);$j++){
            for ($i=0;$i<count($consomation[0]);$i++){

                $ratio[$i]=($consomation[$j][$i][1]/$consomationtot[$i][1]);

                if($consomation[$j][$i][1]>($ratio[$i]*$inject[$i][1])){
                    $min[$i]=($ratio[$i]*$inject[$i][1]);
                }
                else{
                    $min[$i]=$consomation[$j][$i][1];
                }
                $auto_consomer[$j][$i]=[$consomation[0][$i][0],$min[$i]];
                $cedee[$j][$i]=[$consomation[0][$i][0],(($consomation[$j][$i][1]/$consomationtot[$i][1])*$inject[$i][1])-$auto_consomer[$j][$i][1]];
                $importer[$j][$i]=[$consomation[0][$i][0],($consomation[$j][$i][1]-$auto_consomer[$j][$i][1])];
            }
        }

        if($project->getConsomation()->getTypeTarif()==1){
        
            for ($j=$c;$j<count($consomation);$j++){
                for ($i=1;$i<13;$i++){
                    if ( $consomationtotPH[$i]['jour']==0 ){

                        $consomationtotPH[$i]['jour']=1;
                    }

                    if ( $consomationtotPH[$i]['ete']==0 ){

                        $consomationtotPH[$i]['ete']=1;
                    }

                    if ( $consomationtotPH[$i]['soir']==0 ){

                        $consomationtotPH[$i]['soir']=1;
                    }

                    if ( $consomationtotPH[$i]['nuit']==0 ){

                        $consomationtotPH[$i]['nuit']=1;
                    }
                    
                    $auto_consomerPH[$j][$i]['jour']=min($consomationPH[$j][$i]['jour'],(float)($injectPH[$i]['jour']*($consomationPH[$j][$i]['jour']/$consomationtotPH[$i]['jour'])));
                    $auto_consomerPH[$j][$i]['ete']=min($consomationPH[$j][$i]['ete'],(float)($injectPH[$i]['ete']*($consomationPH[$j][$i]['ete']/$consomationtotPH[$i]['ete'])));
                    $auto_consomerPH[$j][$i]['soir']=min($consomationPH[$j][$i]['soir'],(float)($injectPH[$i]['soir']*($consomationPH[$j][$i]['soir']/$consomationtotPH[$i]['soir'])));
                    $auto_consomerPH[$j][$i]['nuit']=min($consomationPH[$j][$i]['nuit'],(float)($injectPH[$i]['nuit']*($consomationPH[$j][$i]['nuit']/$consomationtotPH[$i]['nuit'])));

                    $importerPH[$j][$i]['jour']=$consomationPH[$j][$i]['jour']-$auto_consomerPH[$j][$i]['jour'];
                    $importerPH[$j][$i]['ete']=$consomationPH[$j][$i]['ete']-$auto_consomerPH[$j][$i]['ete'];
                    $importerPH[$j][$i]['soir']=$consomationPH[$j][$i]['soir']-$auto_consomerPH[$j][$i]['soir'];
                    $importerPH[$j][$i]['nuit']=$consomationPH[$j][$i]['nuit']-$auto_consomerPH[$j][$i]['nuit'];


                    $cedeePH[$j][$i]['jour']=(float)($injectPH[$i]['jour']*($consomationPH[$j][$i]['jour']/$consomationtotPH[$i]['jour']))-$auto_consomerPH[$j][$i]['jour'];
                    $cedeePH[$j][$i]['ete']=(float)($injectPH[$i]['ete']*($consomationPH[$j][$i]['ete']/$consomationtotPH[$i]['ete']))-$auto_consomerPH[$j][$i]['ete'];
                    $cedeePH[$j][$i]['soir']=(float)($injectPH[$i]['soir']*($consomationPH[$j][$i]['soir']/$consomationtotPH[$i]['soir']))-$auto_consomerPH[$j][$i]['soir'];
                    $cedeePH[$j][$i]['nuit']=(float)($injectPH[$i]['nuit']*($consomationPH[$j][$i]['nuit']/$consomationtotPH[$i]['nuit']))-$auto_consomerPH[$j][$i]['nuit'];

                }
            }
        }
        else{

            for ($j=$c;$j<count($consomation);$j++){
                $auto_consomerPH[$j]=PostHoraire::PostHoraire($auto_consomer[$j]);
                $importerPH[$j]=PostHoraire::PostHoraire($importer[$j]);
                $cedeePH[$j]=PostHoraire::PostHoraire($cedee[$j]);


            }

        }


        $project->setconsomationPH($consomationPH);
        $project->setproductionPH($productionPH);
        $project->setauto_consomerPH($auto_consomerPH);
        $project->setimporterPH($importerPH);
        $project->setcedeePH($cedeePH);
        $project->setinjectPH($injectPH);




        $project->setinject($inject);
        $project->setAutoConsomer($auto_consomer);
        $project->setCedee($cedee);
        $project->setImporte($importer);
        $this->manager->persist($project);
        $this->manager->flush();
    }
}
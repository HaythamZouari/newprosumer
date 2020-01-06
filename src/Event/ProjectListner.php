<?php


namespace App\Event;


use App\Service\Datesorting;
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
        $consomation=$project->getConsomation()->getConsomationAnnuel();
        if($project->getPvgis() != null)
            $production=$project->getPvgis()->getResult() ;
        else if($project->getCsvProd() != null)
            $production=$project->getCsvProd()->getResult();
        for ($i=0;$i<count($consomation);$i++){
            if($consomation[$i][1]<$production[$i][1]){
                $auto_consomer[$i]=[$production[$i][0],$consomation[$i][1]];
                $cedee[$i]=[$production[$i][0],($production[$i][1]-$auto_consomer[$i][1])];
                $importer[$i]=[$production[$i][0],($consomation[$i][1]-$auto_consomer[$i][1])];
            }
            else
                $auto_consomer[$i]=[$production[$i][0],$production[$i][1]];
            $cedee[$i]=[$production[$i][0],($production[$i][1]-$auto_consomer[$i][1])];
            $importer[$i]=[$production[$i][0],($consomation[$i][1]-$auto_consomer[$i][1])];

        }
        $project->setAutoConsomer($auto_consomer);
        $project->setCedee($cedee);
        $project->setImporte($importer);
        $this->manager->persist($project);
        $this->manager->flush();
    }
}
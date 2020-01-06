<?php


namespace App\Event;


use App\Entity\Project;
use Symfony\Component\EventDispatcher\Event;

class ProjectEvent extends Event
{
    const NAME ='Project.data';
    /**
     * @var Project
     */
    private $project;
    public function __construct(Project $project)
    {
        $this->project = $project;
    }
    /**
     * @return Project
     */
    public function getProject(): Project {
        return $this->project;
    }
}
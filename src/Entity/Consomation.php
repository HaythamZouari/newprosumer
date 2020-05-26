<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\ConsomationRepository")
 */
class Consomation
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="array", nullable=true)
     */

    private $allDateDeb= [];

     /**
     * @ORM\Column(type="array", nullable=true)
     */

    private $allDateFin= [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */

    private $allConsomation_annuel= [];

    
    /**
     * @ORM\Column(type="array", nullable=true)
     */

    private $allTarif= [];

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */

    private $dateDeb;

    /**
     * @ORM\Column(type="datetime", nullable=true)
     */
    private $dateFin;

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $consomation_annuel = [];


    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $url_ccv;

    /**
     * @ORM\Column(type="boolean", nullable=true)
     */
    private $type_tarif;

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Project", mappedBy="consomation", cascade={"persist", "remove"})
     */
    private $project;

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $cm_month = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $avgweek = [];
    public function __construct()
    {
        for ($i =0 ; $i<7;$i++){
            for($j =0;$j<=23;$j++){
                $this->avgweek[0][$i][$j]=0;
                $this->avgweek[1][$i][$j]=0;

            }
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getallDateDeb(): ?array
    {
        return $this->allDateDeb;
    }

    public function setallDateDeb(array $allDateDeb): self
    {
        $this->allDateDeb = $allDateDeb;

        return $this;
    }


    public function getallDateFin(): ?array
    {
        return $this->allDateFin;
    }

    public function setallDateFin(array $allDateFin): self
    {
        $this->allDateFin = $allDateFin;

        return $this;
    }

    public function getallConsomationAnnuel(): ?array
    {
        return $this->allConsomation_annuel;
    }

    public function setallConsomationAnnuel(array $allConsomation_annuel): self
    {
        $this->allConsomation_annuel = $allConsomation_annuel;

        return $this;
    }
  



    public function getTabTarif(): ?array
    {
        return $this->allTarif;
    }

    public function setTabTarif(array $allTarif): self
    {
        $this->allTarif = $allTarif;

        return $this;
    }



    public function getDateDeb(): ?\DateTimeInterface
    {
        return $this->dateDeb;
    }

    public function setDateDeb(\DateTimeInterface $dateDeb): self
    {
        $this->dateDeb = $dateDeb;

        return $this;
    }

    public function getDateFin(): ?\DateTimeInterface
    {
        return $this->dateFin;
    }

    public function setDateFin(\DateTimeInterface $dateFin): self
    {
        $this->dateFin = $dateFin;

        return $this;
    }

    public function getConsomationAnnuel(): ?array
    {
        return $this->consomation_annuel;
    }

    public function setConsomationAnnuel(array $consomation_annuel): self
    {
        $this->consomation_annuel = $consomation_annuel;

        return $this;
    }

    public function getUrlCcv(): ?string
    {
        return $this->url_ccv;
    }

    public function setUrlCcv(string $url_ccv): self
    {
        $this->url_ccv=$this->url_ccv."///".$url_ccv;

        return $this;
    }

    public function getTypeTarif(): ?bool
    {
        return $this->type_tarif;
    }

    public function setTypeTarif(bool $type_tarif): self
    {
        $this->type_tarif = $type_tarif;

        return $this;
    }

    public function getProject(): ?Project
    {
        return $this->project;
    }

    public function setProject(?Project $project): self
    {
        $this->project = $project;

        // set (or unset) the owning side of the relation if necessary
        $newConsomation = $project === null ? null : $this;
        if ($newConsomation !== $project->getConsomation()) {
            $project->setConsomation($newConsomation);
        }

        return $this;
    }
    public function __toString()
    {
        return (string)$this->id;
    }

    public function getCmMonth(): ?array
    {
        return $this->cm_month;
    }

    public function setCmMonth(array $cm_month): self
    {
        $this->cm_month = $cm_month;

        return $this;
    }

    public function getAvgweek(): ?array
    {
        return $this->avgweek;
    }

    public function setAvgweek(array $avgweek): self
    {
        for ($i =0 ; $i<7;$i++){
            for($j =0;$j<=23;$j++){
                $this->avgweek[0][$i][$j]+=$avgweek[0][$i][$j];
                $this->avgweek[1][$i][$j]+=$avgweek[1][$i][$j];

            }
        }
        return $this;
    }
}

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
     * @ORM\Column(type="boolean")
     */
    private $transportEng;


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
     * @ORM\Column(type="array", nullable=true)
     */
    private $allurl_ccv;


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
    private $allcm_month = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $avgweek = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Activite = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Dateconge_deb = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Dateconge_deb1 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Dateconge_deb2 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Dateconge_fin = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Dateconge_fin1 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Dateconge_fin2 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $HourSlider1 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $HourSlider2 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $HourSlider3 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $HourSlider_dimanche = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $HourSlider_samedi = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $MonthSlider1 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $MonthSlider2 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $MonthSlider3 = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $Saison = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $congeCheck = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $dimancheCheck = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $samediCheck = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $vershoraire = [];

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $dateDebForm;

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $ferieCheck = [];
    public function __construct()
    {
       
            $this->transportEng=false;
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


    public function getTransportEng(): ?bool
    {
        return $this->transportEng;
    }

    public function setTransportEng(bool $transportEng): self
    {
        $this->transportEng = $transportEng;

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

    public function getallUrlCcv(): ?array
    {
        return $this->allurl_ccv;
    }

    public function setallUrlCcv(array $allurl_ccv): self
    {
        $this->allurl_ccv=$allurl_ccv;

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

    public function getallCmMonth(): ?array
    {
        return $this->allcm_month;
    }

    public function setallCmMonth(array $allcm_month): self
    {
        $this->allcm_month = $allcm_month;

        return $this;
    }

    public function getAvgweek(): ?array
    {
        return $this->avgweek;
    }

    public function setAvgweek(array $avgweek): self
    {

        $this->avgweek = $avgweek;
        
        return $this;
    }

    public function getActivite(): ?array
    {
        return $this->Activite;
    }

    public function setActivite(?array $Activite): self
    {
        $this->Activite = $Activite;

        return $this;
    }

    public function getDatecongeDeb(): ?array
    {
        return $this->Dateconge_deb;
    }

    public function setDatecongeDeb(?array $Dateconge_deb): self
    {
        $this->Dateconge_deb = $Dateconge_deb;

        return $this;
    }

    public function getDatecongeDeb1(): ?array
    {
        return $this->Dateconge_deb1;
    }

    public function setDatecongeDeb1(?array $Dateconge_deb1): self
    {
        $this->Dateconge_deb1 = $Dateconge_deb1;

        return $this;
    }

    public function getDatecongeDeb2(): ?array
    {
        return $this->Dateconge_deb2;
    }

    public function setDatecongeDeb2(?array $Dateconge_deb2): self
    {
        $this->Dateconge_deb2 = $Dateconge_deb2;

        return $this;
    }

    public function getDatecongeFin(): ?array
    {
        return $this->Dateconge_fin;
    }

    public function setDatecongeFin(?array $Dateconge_fin): self
    {
        $this->Dateconge_fin = $Dateconge_fin;

        return $this;
    }

    public function getDatecongeFin1(): ?array
    {
        return $this->Dateconge_fin1;
    }

    public function setDatecongeFin1(?array $Dateconge_fin1): self
    {
        $this->Dateconge_fin1 = $Dateconge_fin1;

        return $this;
    }

    public function getDatecongeFin2(): ?array
    {
        return $this->Dateconge_fin2;
    }

    public function setDatecongeFin2(?array $Dateconge_fin2): self
    {
        $this->Dateconge_fin2 = $Dateconge_fin2;

        return $this;
    }

    public function getHourSlider1(): ?array
    {
        return $this->HourSlider1;
    }

    public function setHourSlider1(?array $HourSlider1): self
    {
        $this->HourSlider1 = $HourSlider1;

        return $this;
    }

    public function getHourSlider2(): ?array
    {
        return $this->HourSlider2;
    }

    public function setHourSlider2(?array $HourSlider2): self
    {
        $this->HourSlider2 = $HourSlider2;

        return $this;
    }

    public function getHourSlider3(): ?array
    {
        return $this->HourSlider3;
    }

    public function setHourSlider3(?array $HourSlider3): self
    {
        $this->HourSlider3 = $HourSlider3;

        return $this;
    }

    public function getHourSliderDimanche(): ?array
    {
        return $this->HourSlider_dimanche;
    }

    public function setHourSliderDimanche(?array $HourSlider_dimanche): self
    {
        $this->HourSlider_dimanche = $HourSlider_dimanche;

        return $this;
    }

    public function getHourSliderSamedi(): ?array
    {
        return $this->HourSlider_samedi;
    }

    public function setHourSliderSamedi(?array $HourSlider_samedi): self
    {
        $this->HourSlider_samedi = $HourSlider_samedi;

        return $this;
    }

    public function getMonthSlider1(): ?array
    {
        return $this->MonthSlider1;
    }

    public function setMonthSlider1(?array $MonthSlider1): self
    {
        $this->MonthSlider1 = $MonthSlider1;

        return $this;
    }

    public function getMonthSlider2(): ?array
    {
        return $this->MonthSlider2;
    }

    public function setMonthSlider2(?array $MonthSlider2): self
    {
        $this->MonthSlider2 = $MonthSlider2;

        return $this;
    }

    public function getMonthSlider3(): ?array
    {
        return $this->MonthSlider3;
    }

    public function setMonthSlider3(?array $MonthSlider3): self
    {
        $this->MonthSlider3 = $MonthSlider3;

        return $this;
    }

    public function getSaison(): ?array
    {
        return $this->Saison;
    }

    public function setSaison(?array $Saison): self
    {
        $this->Saison = $Saison;

        return $this;
    }

    public function getCongeCheck(): ?array
    {
        return $this->congeCheck;
    }

    public function setCongeCheck(?array $congeCheck): self
    {
        $this->congeCheck = $congeCheck;

        return $this;
    }

    public function getDimancheCheck(): ?array
    {
        return $this->dimancheCheck;
    }

    public function setDimancheCheck(?array $dimancheCheck): self
    {
        $this->dimancheCheck = $dimancheCheck;

        return $this;
    }

    public function getSamediCheck(): ?array
    {
        return $this->samediCheck;
    }

    public function setSamediCheck(?array $samediCheck): self
    {
        $this->samediCheck = $samediCheck;

        return $this;
    }

    public function getVershoraire(): ?array
    {
        return $this->vershoraire;
    }

    public function setVershoraire(?array $vershoraire): self
    {
        $this->vershoraire = $vershoraire;

        return $this;
    }

    public function getDateDebForm(): ?string
    {
        return $this->dateDebForm;
    }

    public function setDateDebForm(?string $dateDebForm): self
    {
        $this->dateDebForm = $dateDebForm;

        return $this;
    }

    public function getFerieCheck(): ?array
    {
        return $this->ferieCheck;
    }

    public function setFerieCheck(?array $ferieCheck): self
    {
        $this->ferieCheck = $ferieCheck;

        return $this;
    }
}

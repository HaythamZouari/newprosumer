<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\ProjectRepository")
 */
class Project
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=50)
     */
    private $name;

    /**
     * @ORM\Column(type="string",nullable=true, length=100)
     */
    private $adress;

    /**
     * @ORM\Column(type="text",nullable=true)
     */
    private $description;



    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\User", inversedBy="projects")
     */
    private $user;

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Pvwatt", inversedBy="project", cascade={"persist", "remove"})
     */
    private $pvwatt;

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Pvgis", inversedBy="project", cascade={"persist", "remove"})
     */
    private $pvgis;

     /**
     * @ORM\OneToOne(targetEntity="App\Entity\Ninja", inversedBy="project", cascade={"persist", "remove"})
     */
    private $ninja;


    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Consomation", inversedBy="project", cascade={"persist", "remove"})
     */
    private $consomation;

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $auto_consomer = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $cedee = [];

    /**
     * @ORM\Column(type="array", nullable=true)
     */
    private $importe = [];

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\CsvProd", inversedBy="project", cascade={"persist", "remove"})
     */
    private $csvProd;

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Finance", inversedBy="project", cascade={"persist", "remove"})
     */
    private $finance;




    public function __construct()
    {
        $this->consomations = new ArrayCollection();
        $this->setConsomation((new Consomation()));
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getAdress(): ?string
    {
        return $this->adress;
    }

    public function setAdress(string $adress): self
    {
        $this->adress = $adress;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }


    public function getPvwatt(): ?Pvwatt
    {
        return $this->pvwatt;
    }

    public function setPvwatt(?Pvwatt $pvwatt): self
    {
        $this->pvwatt = $pvwatt;

        return $this;
    }

    public function getPvgis(): ?Pvgis
    {
        return $this->pvgis;
    }

    public function setPvgis($pvgis): self
    {
        $this->pvgis = $pvgis;

        return $this;
    }

    public function getNinja(): ?Ninja
    {
        return $this->ninja;
    }

    public function setNinja($ninja): self
    {
        $this->ninja = $ninja;

        return $this;
    }


    public function getConsomation(): ?Consomation
    {
        return $this->consomation;
    }

    public function setConsomation(?Consomation $consomation): self
    {
        $this->consomation = $consomation;

        return $this;
    }

    public function getAutoConsomer(): ?array
    {
        return $this->auto_consomer;
    }

    public function setAutoConsomer(?array $auto_consomer): self
    {
        $this->auto_consomer = $auto_consomer;

        return $this;
    }

    public function getCedee(): ?array
    {
        return $this->cedee;
    }

    public function setCedee(?array $cedee): self
    {
        $this->cedee = $cedee;

        return $this;
    }

    public function getImporte(): ?array
    {
        return $this->importe;
    }

    public function setImporte(?array $importe): self
    {
        $this->importe = $importe;

        return $this;
    }


    public function getCsvProd(): ?CsvProd
    {
        return $this->csvProd;
    }

    public function setCsvProd($csvProd): self
    {
        $this->csvProd = $csvProd;

        return $this;
    }

    public function getFinance(): ?Finance
    {
        return $this->finance;
    }

    public function setFinance(?Finance $finance): self
    {
        $this->finance = $finance;

        return $this;
    }



    public function __toString()
    {
        return (string)$this->id;
    }

}

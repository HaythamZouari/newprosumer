<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\CsvProdRepository")
 */
class CsvProd
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=190)
     */
    private $path;

    /**
     * @ORM\Column(type="float")
     */
    private $puissence;

    /**
     * @ORM\Column(type="array")
     */
    private $result = [];

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Project", mappedBy="csvProd", cascade={"persist", "remove"})
     */
    private $project;



    public function __construct()
    {
        $this->projects = new ArrayCollection();
    }


    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPath(): ?string
    {
        return $this->path;
    }

    public function setPath(string $path): self
    {
        $this->path = $path;

        return $this;
    }

    public function getPuissence(): ?float
    {
        return $this->puissence;
    }

    public function setPuissence(float $puissence): self
    {
        $this->puissence = $puissence;

        return $this;
    }


    public function __toString()
    {
        return (string)$this->id;
    }
    public function getResult(): ?array
    {
        return $this->result;
    }

    public function setResult(array $result): self
    {
        $this->result = $result;

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
        $newCsvProd = $project === null ? null : $this;
        if ($newCsvProd !== $project->getCsvProd()) {
            $project->setCsvProd($newCsvProd);
        }

        return $this;
    }



}

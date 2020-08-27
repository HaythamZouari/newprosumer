<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\PvgisRepository")
 */
class Pvgis
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="float")
     */
    private $lat;

    /**
     * @ORM\Column(type="float")
     */
    private $lon;

    /**
     * @ORM\Column(type="integer")
     */
    private $mounting_type;

    /**
     * @ORM\Column(type="array")
     */
    private $slop;

    /**
     * @ORM\Column(type="array")
     */
    private $azimuth;

    /**
     * @ORM\Column(type="string", length=190)
     */
    private $pv_tech;

    /**
     * @ORM\Column(type="array")
     */
    private $peak_power;

    /**
     * @ORM\Column(type="float")
     */
    private $loss;

    /**
     * @ORM\Column(type="float")
     */
    private $degradation;


    /**
     * @ORM\Column(type="array")
     */
    private $result = [];

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Project", mappedBy="pvgis", cascade={"persist", "remove"})
     */
    private $project;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLat(): ?float
    {
        return $this->lat;
    }

    public function setLat(float $lat): self
    {
        $this->lat = $lat;

        return $this;
    }

    public function getLon(): ?float
    {
        return $this->lon;
    }

    public function setLon(float $lon): self
    {
        $this->lon = $lon;

        return $this;
    }

    public function getMountingType(): ?int
    {
        return $this->mounting_type;
    }

    public function setMountingType(int $mounting_type): self
    {
        $this->mounting_type = $mounting_type;

        return $this;
    }

    public function getSlop(): ?array
    {
        return $this->slop;
    }

    public function setSlop(array $slop): self
    {
        $this->slop = $slop;

        return $this;
    }

    public function getAzimuth(): ?array
    {
        return $this->azimuth;
    }

    public function setAzimuth(array $azimuth): self
    {
        $this->azimuth = $azimuth;

        return $this;
    }

    public function getPvTech(): ?string
    {
        return $this->pv_tech;
    }

    public function setPvTech(string $pv_tech): self
    {
        $this->pv_tech = $pv_tech;

        return $this;
    }

    public function getPeakPower(): ?array
    {
        return $this->peak_power;
    }

    public function setPeakPower(array $peak_power): self
    {
        $this->peak_power = $peak_power;

        return $this;
    }

    public function getLoss(): ?float
    {
        return $this->loss;
    }

    public function setLoss(float $loss): self
    {
        $this->loss = $loss;

        return $this;
    }

    public function getDegradation(): ?float
    {
        return $this->degradation;
    }

    public function setDegradation(float $degradation): self
    {
        $this->degradation = $degradation;

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
        $newPvgis = $project === null ? null : $this;
        if ($newPvgis !== $project->getPvgis()) {
            $project->setPvgis($newPvgis);
        }

        return $this;
    }
}

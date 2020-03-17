<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\FinanceRepository")
 */
class Finance
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
    private $capex;

    /**
     * @ORM\Column(type="float")
     */
    private $subvention;

    /**
     * @ORM\Column(type="float")
     */
    private $duree_proj;

    /**
     * @ORM\Column(type="float")
     */
    private $aug_tarif_vende;

    /**
     * @ORM\Column(type="float")
     */
    private $aug_tarif_achat;

    /**
     * @ORM\Column(type="float")
     */
    private $taux_actualisation;

    /**
     * @ORM\Column(type="boolean")
     */
    private $credit;

    /**
     * @ORM\Column(type="float", nullable=false ,  options={"default" : 0})
     */
    private $montant_dette;

    /**
     * @ORM\Column(type="float", nullable=true)
     */
    private $taux_interet;

    /**
     * @ORM\Column(type="float", nullable=true)
     */
    private $delai_grace;

    /**
     * @ORM\Column(type="float", nullable=true)
     */
    private $maturite_proj;


    public function __toString()
    {
        return (string)$this->id;
    }
    /**
     * @ORM\Column(type="float")
     */
    private $tarifUni;

    /**
     * @ORM\Column(type="array")
     */
    private $tarifHoraire = [];

    /**
     * @ORM\Column(type="float")
     */
    private $degradation;

    /**
     * @ORM\Column(type="float")
     */
    private $opex;

    /**
     * @ORM\Column(type="float")
     */
    private $tarifTransport;

    /**
     * @ORM\OneToOne(targetEntity="App\Entity\Project", mappedBy="finance", cascade={"persist", "remove"})
     */
    private $project;

    /**
     * @ORM\Column(type="array")
     */
    private $f_regularisation = [];

    /**
     * @ORM\Column(type="array")
     */
    private $factransport = [];

    /**
     * @ORM\Column(type="float")
     */
    private $van;

    /**
     * @ORM\Column(type="float")
     */
    private $tri25;


    /**
     * @ORM\Column(type="float")
     */
    private $wacc;

    /**
     * @ORM\Column(type="array")
     */
    private $annuite;

    /**
     * @ORM\Column(type="boolean")
     */
    private $transportEng;

    /**
     * @ORM\Column(type="float")
     */
    private $depense;

    /**
     * @ORM\Column(type="array")
     */
    private $Gain_cedee = [];

    /**
     * @ORM\Column(type="array")
     */
    private $Gain_transporter = [];

    /**
     * @ORM\Column(type="array")
     */
    private $cashflow = [];

    /**
     * @ORM\Column(type="array")
     */
    private $cashflow_cum = [];

    /**
     * @ORM\Column(type="array")
     */
    private $cfads = [];

    /**
     * @ORM\Column(type="array")
     */
    private $dscr = [];

    /**
     * @ORM\Column(type="array")
     */
    private $gain_ans = [];

    /**
     * @ORM\Column(type="array")
     */
    private $llcr = [];

    /**
     * @ORM\Column(type="float")
     */
    private $cashflowIn;

    /**
     * @ORM\Column(type="float")
     */
    private $tricapitaux;

    /**
     * @ORM\Column(type="array")
     */
    private $soldrep = [];



    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCapex(): ?float
    {
        return $this->capex;
    }

    public function setCapex(float $capex): self
    {
        $this->capex = $capex;

        return $this;
    }

    public function getSubvention(): ?float
    {
        return $this->subvention;
    }

    public function setSubvention(float $subvention): self
    {
        $this->subvention = $subvention;

        return $this;
    }
    public function __construct()
    {
        $this->wacc=0;
        $this->tri25=0;
        $this->tricapitaux=0;
        $this->van =0;
        $this->maturite_proj=0;
        $this->delai_grace=0;
        $this->taux_interet=0;
        $this->montant_dette=0;
    }

    public function getDureeProj()
    {
        return $this->duree_proj;
    }

    public function setDureeProj(float $duree_proj): self
    {
        $this->duree_proj = $duree_proj;

        return $this;
    }

    public function getAugTarifVende(): ?float
    {
        return $this->aug_tarif_vende;
    }

    public function setAugTarifVende(float $aug_tarif_vende): self
    {
        $this->aug_tarif_vende = $aug_tarif_vende;

        return $this;
    }

    public function getAugTarifAchat(): ?float
    {
        return $this->aug_tarif_achat;
    }

    public function setAugTarifAchat(float $aug_tarif_achat): self
    {
        $this->aug_tarif_achat = $aug_tarif_achat;

        return $this;
    }

    public function getTauxActualisation(): ?float
    {
        return $this->taux_actualisation;
    }

    public function setTauxActualisation(float $taux_actualisation): self
    {
        $this->taux_actualisation = $taux_actualisation;

        return $this;
    }

    public function getCredit(): ?bool
    {
        return $this->credit;
    }

    public function setCredit(bool $credit): self
    {
        $this->credit = $credit;

        return $this;
    }

    public function getMontantDette(): ?float
    {
        return $this->montant_dette;
    }

    public function setMontantDette(?float $montant_dette): self
    {
        $this->montant_dette = $montant_dette;

        return $this;
    }

    public function getTauxInteret(): ?float
    {
        return $this->taux_interet;
    }

    public function setTauxInteret(float $taux_interet): self
    {
        $this->taux_interet = $taux_interet;

        return $this;
    }

    public function getDelaiGrace(): ?float
    {
        return $this->delai_grace;
    }

    public function setDelaiGrace(?float $delai_grace): self
    {
        $this->delai_grace = $delai_grace;

        return $this;
    }

    public function getMaturiteProj(): ?float
    {
        return $this->maturite_proj;
    }

    public function setMaturiteProj(?float $maturite_proj): self
    {
        $this->maturite_proj = $maturite_proj;

        return $this;
    }


    public function getTarifUni(): ?float
    {
        return $this->tarifUni;
    }

    public function setTarifUni(float $tarifUni): self
    {
        $this->tarifUni = $tarifUni;

        return $this;
    }

    public function getTarifHoraire(): ?array
    {
        return $this->tarifHoraire;
    }

    public function setTarifHoraire(array $tarifHoraire): self
    {
        $this->tarifHoraire = $tarifHoraire;

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

    public function getOpex(): ?float
    {
        return $this->opex;
    }

    public function setOpex(float $opex): self
    {
        $this->opex = $opex;

        return $this;
    }


    public function getTarifTransport(): ?float
    {
        return $this->tarifTransport;
    }

    public function setTarifTransport(float $tarifTransport): self
    {
        $this->tarifTransport = $tarifTransport;

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
        $newFinance = $project === null ? null : $this;
        if ($newFinance !== $project->getFinance()) {
            $project->setFinance($newFinance);
        }

        return $this;
    }

    public function getFRegularisation(): ?array
    {
        return $this->f_regularisation;
    }

    public function getfactransport(): ?array
    {
        return $this->factransport;
    }

    public function setFRegularisation(array $f_regularisation): self
    {
        $this->f_regularisation = $f_regularisation;

        return $this;
    }

    public function setfactransport(array $factransport): self
    {
        $this->factransport = $factransport;

        return $this;
    }

    public function getVan(): ?float
    {
        return $this->van;
    }

    public function setVan(float $van): self
    {
        $this->van = $van;

        return $this;
    }

    public function getTri25(): ?float
    {
        return $this->tri25;
    }

    public function setTri25(float $tri25): self
    {
        $this->tri25 = $tri25;

        return $this;
    }



    public function getWacc(): ?float
    {
        return $this->wacc;
    }

    public function setWacc(float $wacc): self
    {
        $this->wacc = $wacc;

        return $this;
    }

    public function getAnnuite(): ?array
    {
        return $this->annuite;
    }

    public function setAnnuite(array $annuite): self
    {
        $this->annuite = $annuite;

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

    public function getDepense(): ?float
    {
        return $this->depense;
    }

    public function setDepense(float $depense): self
    {
        $this->depense = $depense;

        return $this;
    }

    public function getGainCedee(): ?array
    {
        return $this->Gain_cedee;
    }

    public function setGainCedee(array $Gain_cedee): self
    {
        $this->Gain_cedee = $Gain_cedee;

        return $this;
    }

    public function getGainTransporter(): ?array
    {
        return $this->Gain_transporter;
    }

    public function setGainTransporter(array $Gain_transporter): self
    {
        $this->Gain_transporter = $Gain_transporter;

        return $this;
    }

    public function getCashflow(): ?array
    {
        return $this->cashflow;
    }

    public function setCashflow(array $cashflow): self
    {
        $this->cashflow = $cashflow;

        return $this;
    }

    public function getCashflowCum(): ?array
    {
        return $this->cashflow_cum;
    }

    public function setCashflowCum(array $cashflow_cum): self
    {
        $this->cashflow_cum = $cashflow_cum;

        return $this;
    }

    public function getCfads(): ?array
    {
        return $this->cfads;
    }

    public function setCfads(array $cfads): self
    {
        $this->cfads = $cfads;

        return $this;
    }

    public function getDscr(): ?array
    {
        return $this->dscr;
    }

    public function setDscr(array $dscr): self
    {
        $this->dscr = $dscr;

        return $this;
    }

    public function getGainAns(): ?array
    {
        return $this->gain_ans;
    }

    public function setGainAns(array $gain_ans): self
    {
        $this->gain_ans = $gain_ans;

        return $this;
    }

    public function getLlcr(): ?array
    {
        return $this->llcr;
    }

    public function setLlcr(array $llcr): self
    {
        $this->llcr = $llcr;

        return $this;
    }

    public function getCashflowIn(): ?float
    {
        return $this->cashflowIn;
    }

    public function setCashflowIn(float $cashflowIn): self
    {
        $this->cashflowIn = $cashflowIn;

        return $this;
    }

    public function getTricapitaux(): ?float
    {
        return $this->tricapitaux;
    }

    public function setTricapitaux(float $tricapitaux): self
    {
        $this->tricapitaux = $tricapitaux;

        return $this;
    }

    public function getSoldrep(): ?array
    {
        return $this->soldrep;
    }

    public function setSoldrep(array $soldrep): self
    {
        $this->soldrep = $soldrep;

        return $this;
    }


}

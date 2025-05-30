# Applicazione per ordinazioni

L'applicazione nasce con lo scopo di semplificare le ordinazioni di poke per un gruppo di persone.

Presuppone che il ristorante scelto accetti ordinazioni tramite whatsapp.

## Indice

[Configurazione](#configurazione)

[Funzionalità](#funzionalità)
- [Configuratore](#configuratore)
- [Carrello](#carrello)
- [Preferiti](#preferiti)

[Tema](#tema)

[Persistenza](#persistenza)



## Configurazione

Gli ingredienti con il quale viene assemblata la poke sono facilemente configurabili tramite un file di configurazione dedicato _config.json_.

Tramite questo file è possibile modificare le dimensioni di partenza con relativi limiti per gruppo di ingredienti, limiti oltre i quali verrà pagato un importo extra (modificabile).

È possibile aggiungere e rimuovere ingredienti, in modo da poter rimanere al passo con eventuali modifiche del menu del ristorante di riferimento.


## Funzionalità

L'applicazione si può suddividere nelle seguenti aree:

[**Configuratore**](#configuratore): tramite il quale viene composta ogni poke

[**Carrello**](#carrello): nel quale è possibile salvare diverse poke

[**Preferiti**](#preferiti): nei quali è possibile salvare diverse poke in modo da recuperarle successivamente


#### Configuratore
---
Presente nella schermata principale, permette di assemblare una poke e viene utilizzato anche per modificarne una presente nel carrello o nei preferiti.

#### Carrello
---
Accessibile tramite icona dedicata, presenta una lista di poke.
Ogni Poke aggiunta al carrello è successivamente modificabile, aggiungiile ai preferiti, duplicata, o rimossa dal carrello.

Se si sceglie di modificare una poke aggiunta al carrello questa verrà sostituita nel momento in cui verrà eseguito il salvataggio dal configuratore.

Dal carrello è ovviamente possibile infine procedere con l'ordine vero e proprio. Una schermata permetterà l'inserimento di un nome (opzionale) e un orario al quale effettuare l'ordinazione.
È presente anche un'anteprima (modificabile) del messaggio che verrà inviato.

Se nel file di configurazione è indicato un numero di telefono, il messaggio verrà caricato come bozza nella relativa chat, altrimenti verrà richiesto a chi inviare il messaggio.

#### Preferiti
---
Per salvare una poke per successive ordinazioni, è possibile aggiungerla tra i preferiti.

Questa operazione avviene tramite il bottone dedicata nel carrello.

Dalla pagina dei preferiti, accessibile da menu dedicato, è possibile aggiungere una poke al carrello, modificarla, duplicarla o rimuoverla dai preferiti.

La modifica, analogamente a quella effettuata dal carrello, carica la poke nel configuratore e, al salvataggio, sostituisce l'originale nei preferiti.


### Tema
---
Da sezione dedicata nel menu principale è possibile scegliere la preferenza sul tema tra le seguenti opzioni:

**AUTO** (deafult): segue le impostazioni di sistema del dispositivo

**LIGHT**: Forza il tema chiaro

**DARK**: Forza il tema scuro

### Persistenza
---

Di base la persistenza delle informazioni inserite è gestita tramite l'utilizzo del localStorage.

In particolare viene salvata l'ultima poke caricata nel configuratore (ad ogni modifica), il carrello, i preferiti, il nome con il quale effetturare l'ordinazione, l'orario scelto per l'ultima ordinazione e la preferenza sul tema.

Nelle ultime versioni dell'applicazione è stato aggiunta una persistenza anche cross-device tramite l'intergrazione con Google Firebase, in particolare sfruttando i moduli Authentication e Realtime Database.
Per il momento è stata aggiunta questo tipo di persistenza per il solo carrello, in quanto, oltre alla possibilità di ritrovare i proprio carrelli a prescindere dal device tramite il quale si accede al sito, ha permesso di inserire una funzionalità di condivisione dei carrelli tramite un apposito link di invito.

Questo con l'obiettivo principale di semplificare le operazioni di coordinazione durante l'ordinazione comune di un gruppo di conoscienti.


Per questioni di sicurezza e miglior controllo di eventuali costi di gestione, al momento, l'utilizzo delle funzionalità di condivisione e salvataggio delle informazioni tramite Google Firebase è disabiliato fino ad abilitazione da parte di un utente amministratore.


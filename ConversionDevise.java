import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class ConversionDevise {

    private static Map<String, Double> tauxEchange =  Map.of(
        "USD", 1.0, // Dollar américain
        "GNF", 9000.0,  // Franc guinéen
        "FCFA", 605.0,  // Franc CFA
        "EUR", 0.9,     // Euro
        "GBP", 0.8,     // Livre sterling
        "JPY", 110.0,   // Yen japonais
        "CAD", 1.3          // Dollar canadien
    );

    private static double convertion(double amount, String deviseEntrant, String deviseSortant) {
        if (!tauxEchange.containsKey(deviseEntrant) || !tauxEchange.containsKey(deviseSortant)) {
            throw new IllegalArgumentException("Devise inconnue");
        }
        double totalEnDevise = amount / tauxEchange.get(deviseEntrant);
        return totalEnDevise * tauxEchange.get(deviseSortant);
    }

    private static String formatMontant(double montant) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.FRANCE);
        symbols.setGroupingSeparator(' ');
        symbols.setDecimalSeparator(',');
        DecimalFormat df = new DecimalFormat("#,###.00", symbols);
        return df.format(montant);
    }



    public static void main(String[] args) {
        List<String> listTauxEchange = List.copyOf(tauxEchange.keySet());
        String origineMsg = "Entrez le numéro correspondant à la devise du montant saisie : ";
        String convertionMsg = "Entrez le numéro correspondant à la devise de convertion: ";
        String errorMsg = "Erreur Devise inconnue.\nVeuillez entrer un numéro de devise valide comprise entre : 1 et " + listTauxEchange.size() + ".\n";

        String errorValidNumMsg = "Erreur : Veuillez entrer un entier positif.";


        Scanner scanner = new Scanner(System.in);
        System.out.println("--------------------------------");
        System.out.println("SYSTEME DE CONVERSION DE DEVISES\n - Kossi TSOLEGNAGBO\n - Romaric MOUHI");
        System.out.println("--------------------------------");

        double montantBrut = 0;
        while (true) {
            System.out.print("Entrez un montant positif à convertir : ");
            try {
                String input = scanner.nextLine();
                input = input.replace(',', '.');
                montantBrut = Double.parseDouble(input);
                if (montantBrut <= 0) {
                    System.out.println(errorValidNumMsg);
                } else {
                    break;
                }
            } catch (NumberFormatException e) {
                System.out.println(errorValidNumMsg);
            }
        }

        System.out.println("List des devises disponibles :");
        for (int i = 0; i < listTauxEchange.size(); i++) {
            System.out.printf("%d. %s%n", i + 1, listTauxEchange.get(i));
        }

        String deviseEntrant;
        while (true) {
            System.out.print(origineMsg);
            try {
                int choice = Integer.parseInt(scanner.nextLine());
                if (choice > 0 && choice <= listTauxEchange.size()) {
                    deviseEntrant = listTauxEchange.get(choice - 1);
                    if (tauxEchange.containsKey(deviseEntrant)) {
                        break;
                    } else {
                        System.out.println(errorMsg);
                    }
                } else {
                    System.out.println(errorMsg);
                }
            } catch (NumberFormatException e) {
                System.out.println(errorMsg);
            }
        }
        System.out.printf("Le montant à convertir est : %s %s%n%n", formatMontant(montantBrut), deviseEntrant);

        String deviseSortant;
        while (true) {
            System.out.print(convertionMsg);
            try {
                int choice = Integer.parseInt(scanner.nextLine());
                if (choice > 0 && choice <= listTauxEchange.size()) {
                    deviseSortant = listTauxEchange.get(choice - 1);
                    if (tauxEchange.containsKey(deviseSortant)) {
                        if (deviseSortant == deviseEntrant){
                            System.out.println("La devise de convertion sortante doit être differente de la devise à convertir!");
                            System.out.println(errorMsg);
                        } else {
                            break;
                        }
                    } else {
                        System.out.println(errorMsg);
                    }
                } else {
                    System.out.println(errorMsg);
                }
            } catch (NumberFormatException e) {
                System.out.println(errorMsg);
            }
        }
        System.out.printf("La devise de convertion sortant est : %s%n", deviseSortant);

        try {
            double montantConverti = convertion(montantBrut, deviseEntrant, deviseSortant);
            System.out.printf("%n%s %s est égal à %s %s%n", formatMontant(montantBrut), deviseEntrant, formatMontant(montantConverti), deviseSortant);
        } catch (IllegalArgumentException e) {
            System.out.println("Erreur : " + e.getMessage());
        }

        scanner.close();
    }
}


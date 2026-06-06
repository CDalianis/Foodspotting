package gr.projectfoodspots.model;

public enum PlaceTag {
    BURGER_STORE("Burger Store"),
    SOUVLAKI("Souvlaki"),
    PIZZA("Pizza"),
    MEXICAN("Mexican"),
    ETHNIC("Ethnic"),
    CANTEEN("Canteen"),
    CAFE("Cafe"),
    ASIAN("Asian"),
    SEAFOOD("Seafood"),
    OTHER("Other");

    private final String label;

    PlaceTag(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

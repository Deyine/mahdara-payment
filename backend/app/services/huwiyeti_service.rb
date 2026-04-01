class HuwiyetiService
  include HTTParty

  API_BASE_URL = "https://api-houwiyeti.anrpts.gov.mr/houwiyetiapi/v1/partners"
  API_KEY = Rails.application.credentials.huwiyeti_api_key || ENV['HUWIYETI_API_KEY'] || 'tufjru8k-5b1b-4b1f-8e9f-1d3c5b1b4b1f'

  def get_person_by_nni(nni)
    response = self.class.post(
      "#{API_BASE_URL}/getPersonne",
      body: { nni: nni }.to_json,
      headers: {
        'Content-Type' => 'application/json',
        'entity-api-key' => API_KEY
      },
      timeout: 10
    )

    raise StandardError, "NNI introuvable" unless response.success?

    data = response.parsed_response
    personne = data['personne'] || {}

    {
      nni: personne['nni'] || nni,
      first_name: personne['prenomAr'],
      last_name: personne['patronymeAr'],
      first_name_fr: personne['prenomFr'],
      last_name_fr: personne['patronymeFr'],
      pere_prenom_ar: personne['perePrenomAr'],
      pere_prenom_fr: personne['perePrenomFr'],
      birth_date: parse_date(personne['dateNaissance']),
      gender: personne['sexeCode'],
      birth_place: personne['lieuNaissanceFr'],
      photo: data['photo']
    }
  rescue HTTParty::Error, Net::ReadTimeout, SocketError => e
    raise StandardError, "Erreur de connexion à l'API gouvernementale"
  end

  private

  def parse_date(date_str)
    return nil if date_str.blank?
    Date.parse(date_str)
  rescue Date::Error
    nil
  end
end

class MahdaraSerializer
  def self.one(m)
    return nil unless m
    {
      id: m.id,
      nom: m.nom,
      numero_releve: m.numero_releve,
      mahdara_type: m.mahdara_type,
      wilaya: m.wilaya ? WilayaSerializer.one(m.wilaya) : nil,
      moughataa: m.moughataa ? { id: m.moughataa.id, name: m.moughataa.name } : nil,
      commune: m.commune ? { id: m.commune.id, name: m.commune.name } : nil,
      village: m.village ? { id: m.village.id, name: m.village.name } : nil,
      nombre_etudiants: m.nombre_etudiants,
      mahl_ilmi_attached: m.mahl_ilmi.attached?,
      mahl_ilmi_filename: m.mahl_ilmi.attached? ? m.mahl_ilmi.filename.to_s : nil
    }
  end

  def self.many(records)
    records.map { |m| one(m) }
  end
end

import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models.entities import SourceFile
from backend.app.dataset.processor import DatasetProcessor
from backend.app.utils.loc_counter import count_file_lines

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_count_file_lines(tmp_path):
    c_file = tmp_path / "test.c"
    c_file.write_text("""#include <stdio.h>
// Single line comment
/* Multi line
   comment */

int main() {
    return 0;
}
""")
    res = count_file_lines(str(c_file))
    assert res["total_lines"] == 8
    assert res["comment_lines"] == 3
    assert res["code_lines"] == 4
    assert res["blank_lines"] == 1

def test_dataset_ingestion(db_session, tmp_path):
    sub_dir = tmp_path / "snapshot_20231012" / "c"
    sub_dir.mkdir(parents=True)
    f1 = sub_dir / "sample.c"
    f1.write_text("int main() { return 0; }")

    processor = DatasetProcessor(base_dir=str(tmp_path))
    res = processor.scan_and_ingest(db_session)
    assert res["success"] is True
    assert res["files_added"] == 1

    files = db_session.query(SourceFile).all()
    assert len(files) == 1
    assert files[0].language == "c"
    assert files[0].snapshot == "snapshot_20231012"
